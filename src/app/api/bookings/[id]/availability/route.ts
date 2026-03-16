import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyGuestBookingToken } from "@/lib/guest-token";
import { getAvailableSlots } from "@/lib/supabase/queries";

type Context = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Context) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Valid date query (YYYY-MM-DD) required" },
      { status: 400 }
    );
  }

  const guestToken = req.headers.get("x-guest-token");
  const supabase = await createClient();
  const admin = await createAdminClient();

  if (guestToken) {
    const payload = verifyGuestBookingToken(guestToken);
    if (!payload || payload.appointmentId !== id) {
      return NextResponse.json(
        { error: "Invalid or expired guest link" },
        { status: 403 }
      );
    }
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row } = await (supabase as any)
      .from("appointments")
      .select("id")
      .eq("id", id)
      .eq("customer_id", user.id)
      .single();
    if (!row) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: apt } = await (admin as any)
    .from("appointments")
    .select("business_id, staff_id")
    .eq("id", id)
    .single();
  if (!apt) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: services } = await (admin as any)
    .from("appointment_services")
    .select("service_id")
    .eq("appointment_id", id);
  const serviceIds = (services ?? []).map((s: { service_id: string }) => s.service_id);
  if (serviceIds.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  const slots = await getAvailableSlots({
    businessId: apt.business_id,
    serviceIds,
    fromDate: date,
    toDate: date,
    staffId: apt.staff_id ?? undefined,
  });
  return NextResponse.json({ slots });
}
