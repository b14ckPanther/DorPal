import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyGuestBookingToken } from "@/lib/guest-token";
import { getAvailableSlots } from "@/lib/supabase/queries";

async function triggerNotification(
  type: "reschedule" | "cancellation",
  appointmentId: string
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;
  try {
    await fetch(`${url}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ type, booking_id: appointmentId }),
    });
  } catch (e) {
    console.error("Failed to trigger notification", e);
  }
}

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("appointments")
    .select(
      `
      id, business_id, staff_id, start_at, end_at, status, total_duration_minutes, total_price, currency,
      businesses ( id, name_en, slug ),
      appointment_services ( service_id, service_name_snapshot, duration_minutes_snapshot, price_snapshot )
    `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: data ? 500 : 404 }
    );
  }
  return NextResponse.json(data);
}

async function assertCanManage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  guestToken?: string | null
): Promise<{ ok: true; userId?: string } | { ok: false; status: number; body: object }> {
  if (guestToken) {
    const payload = verifyGuestBookingToken(guestToken);
    if (!payload || payload.appointmentId !== id) {
      return { ok: false, status: 403, body: { error: "Invalid or expired guest link" } };
    }
    return { ok: true };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from("appointments")
    .select("id, customer_id")
    .eq("id", id)
    .single();
  if (!row || row.customer_id !== user.id) {
    return { ok: false, status: 404, body: { error: "Booking not found" } };
  }
  return { ok: true, userId: user.id };
}

export async function PATCH(req: Request, context: Context) {
  const { id } = await context.params;
  const guestToken = req.headers.get("x-guest-token");
  const supabase = await createClient();
  const admin = await createAdminClient();

  const auth = await assertCanManage(supabase, id, guestToken ?? undefined);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }

  const body = await req.json().catch(() => ({})) as {
    action?: string;
    startAt?: string;
    endAt?: string;
    reason?: string;
  };

  if (body.action === "reschedule") {
    const { startAt, endAt } = body;
    if (!startAt || !endAt) {
      return NextResponse.json(
        { error: "startAt and endAt required" },
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: apt, error: fetchErr } = await (admin as any)
      .from("appointments")
      .select("business_id, staff_id, status")
      .eq("id", id)
      .single();
    if (fetchErr || !apt) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (apt.status === "cancelled" || apt.status === "no_show") {
      return NextResponse.json(
        { error: "Cannot reschedule cancelled or no-show booking" },
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: services } = await (admin as any)
      .from("appointment_services")
      .select("service_id")
      .eq("appointment_id", id);
    const serviceIds = (services ?? []).map((s: { service_id: string }) => s.service_id);
    if (serviceIds.length === 0) {
      return NextResponse.json(
        { error: "No services on booking" },
        { status: 400 }
      );
    }
    const fromDate = startAt.slice(0, 10);
    const slots = await getAvailableSlots({
      businessId: apt.business_id,
      serviceIds,
      fromDate,
      toDate: fromDate,
      staffId: apt.staff_id ?? undefined,
    });
    const valid = slots.some(
      (s) => s.start_at === startAt && s.end_at === endAt
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Selected slot is no longer available" },
        { status: 400 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("appointments")
      .update({
        start_at: startAt,
        end_at: endAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message ?? "Update failed" },
        { status: 400 }
      );
    }
    await (admin as any).from("appointment_status_history").insert({
      appointment_id: id,
      to_status: apt.status,
      note: "reschedule",
    });
    await triggerNotification("reschedule", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "cancel") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: apt, error: fetchErr } = await (admin as any)
      .from("appointments")
      .select("id, status, deposit_paid_at")
      .eq("id", id)
      .single();
    if (fetchErr || !apt) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (apt.status === "cancelled") {
      return NextResponse.json({ ok: true });
    }
    const cancelledBy = auth.userId ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateErr } = await (admin as any)
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_reason: body.reason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message ?? "Update failed" },
        { status: 400 }
      );
    }
    await (admin as any).from("appointment_status_history").insert({
      appointment_id: id,
      from_status: apt.status,
      to_status: "cancelled",
      changed_by: cancelledBy,
      note: body.reason ?? "Customer cancelled",
    });
    if (apt.deposit_paid_at) {
      // Optional: create refund record for later processing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: payment } = await (admin as any)
        .from("payments")
        .select("id, amount")
        .eq("appointment_id", id)
        .eq("kind", "deposit")
        .limit(1)
        .single();
      if (payment) {
        await (admin as any).from("refunds").insert({
          payment_id: payment.id,
          amount: payment.amount,
          currency: "ILS",
          status: "pending",
          reason: "Customer cancelled",
          created_by: cancelledBy,
        });
      }
    }
    await triggerNotification("cancellation", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Missing or invalid action" },
    { status: 400 }
  );
}
