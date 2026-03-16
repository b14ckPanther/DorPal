import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getDashboardAnalytics } from "@/lib/supabase/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || new Date().toISOString().slice(0, 10);
    const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);
    const data = await getDashboardAnalytics(ctx.businessId, from, to);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard analytics GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
