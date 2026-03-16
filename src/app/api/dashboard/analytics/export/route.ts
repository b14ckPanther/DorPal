import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getBookingsList } from "@/lib/supabase/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const list = await getBookingsList(ctx.businessId, { from: from || undefined, to: to || undefined });
    const headers = "Date,Start,End,Customer,Staff,Services,Status,Price\n";
    const rows = list.map((b) => [
      b.start_at.slice(0, 10),
      b.start_at,
      b.end_at,
      (b.customer_name || b.guest_name || "").replace(/"/g, '""'),
      (b.staff_name || "").replace(/"/g, '""'),
      (b.service_names.join("; ") || "").replace(/"/g, '""'),
      b.status,
      b.total_price,
    ].map((c) => `"${c}"`).join(",")).join("\n");
    const csv = "\uFEFF" + headers + rows;
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings-${from}-${to}.csv"` },
    });
  } catch (err) {
    console.error("Dashboard analytics export:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
