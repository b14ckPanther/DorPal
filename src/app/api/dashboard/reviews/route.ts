import { NextResponse } from "next/server";
import { getDashboardBusinessId, getReviewsForDashboard } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const list = await getReviewsForDashboard(ctx.businessId);
    return NextResponse.json(list);
  } catch (err) {
    console.error("Dashboard reviews GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
