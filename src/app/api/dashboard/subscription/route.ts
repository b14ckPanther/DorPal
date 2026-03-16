import { NextResponse } from "next/server";
import { getDashboardBusinessId, getSubscriptionForDashboard } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const sub = await getSubscriptionForDashboard(ctx.businessId);
    return NextResponse.json(sub ?? {});
  } catch (err) {
    console.error("Dashboard subscription GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
