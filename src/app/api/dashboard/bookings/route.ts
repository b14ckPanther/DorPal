import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getBookingsList } from "@/lib/supabase/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const status = searchParams.get("status") || undefined;
    const staff_id = searchParams.get("staff_id") || undefined;
    const service_id = searchParams.get("service_id") || undefined;

    const list = await getBookingsList(ctx.businessId, { from, to, status, staff_id, service_id });
    return NextResponse.json(list);
  } catch (err) {
    console.error("Dashboard bookings GET:", err);
    return NextResponse.json({ message: "Failed to load bookings" }, { status: 500 });
  }
}
