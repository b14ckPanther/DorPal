import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getScheduleData } from "@/lib/supabase/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const staff_id = searchParams.get("staff_id") || undefined;

    if (!from || !to) {
      return NextResponse.json({ message: "from and to (YYYY-MM-DD) required" }, { status: 400 });
    }

    const { appointments, blocks } = await getScheduleData(ctx.businessId, from, to, staff_id || null);
    return NextResponse.json({ appointments, blocks });
  } catch (err) {
    console.error("Dashboard schedule GET:", err);
    return NextResponse.json({ message: "Failed to load schedule" }, { status: 500 });
  }
}
