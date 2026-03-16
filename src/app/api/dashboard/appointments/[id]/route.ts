import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardBusinessId, getAvailableSlots } from "@/lib/supabase/queries";

async function triggerNotification(type: "reschedule" | "cancellation", appointmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;
  try {
    await fetch(`${url}/functions/v1/send-notification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ type, booking_id: appointmentId }),
    });
  } catch (e) {
    console.error("Failed to trigger notification", e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      start_at?: string;
      end_at?: string;
      reason?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: apt, error: fetchErr } = await sb
      .from("appointments")
      .select("id, business_id, staff_id, status, start_at, end_at")
      .eq("id", id)
      .single();

    if (fetchErr || !apt) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (apt.business_id !== ctx.businessId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    if (body.action === "cancel") {
      if (apt.status === "cancelled") return NextResponse.json({ ok: true });
      const { error: updateErr } = await sb
        .from("appointments")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: body.reason ?? null,
          updated_by: user.id,
        })
        .eq("id", id);
      if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 });
      await triggerNotification("cancellation", id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "no_show") {
      if (apt.status === "no_show") return NextResponse.json({ ok: true });
      const { error: updateErr } = await sb
        .from("appointments")
        .update({
          status: "no_show",
          no_show_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", id);
      if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reschedule") {
      const { start_at, end_at } = body;
      if (!start_at || !end_at) return NextResponse.json({ message: "start_at and end_at required" }, { status: 400 });
      if (apt.status === "cancelled" || apt.status === "no_show") {
        return NextResponse.json({ message: "Cannot reschedule cancelled or no-show" }, { status: 400 });
      }
      const { data: svcRows } = await sb.from("appointment_services").select("service_id").eq("appointment_id", id);
      const serviceIds = (svcRows ?? []).map((s: { service_id: string }) => s.service_id);
      if (serviceIds.length === 0) return NextResponse.json({ message: "No services on booking" }, { status: 400 });
      const fromDate = start_at.slice(0, 10);
      const slots = await getAvailableSlots({
        businessId: apt.business_id,
        serviceIds,
        fromDate,
        toDate: fromDate,
        staffId: apt.staff_id ?? null,
      });
      const valid = slots.some((s) => s.start_at === start_at && s.end_at === end_at);
      if (!valid) return NextResponse.json({ message: "Slot no longer available" }, { status: 400 });
      const { error: updateErr } = await sb
        .from("appointments")
        .update({ start_at, end_at, updated_by: user.id })
        .eq("id", id);
      if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 });
      await triggerNotification("reschedule", id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Dashboard appointments PATCH:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
