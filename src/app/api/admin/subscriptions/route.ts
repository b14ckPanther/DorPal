import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const business_id = searchParams.get("business_id") ?? "";
  const supabase = await createAdminClient();
  const sb = supabase as any;
  let query = sb.from("business_subscriptions").select("id, business_id, plan_id, status, current_period_start, current_period_end, trial_ends_at, subscription_plans(name_en, slug), businesses(name_en, slug)").order("current_period_end", { ascending: false }).limit(100);
  if (business_id) query = query.eq("business_id", business_id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
