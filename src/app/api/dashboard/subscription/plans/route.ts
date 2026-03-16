import { NextResponse } from "next/server";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data, error } = await sb
      .from("subscription_plans")
      .select("id, slug, name_en, name_ar, name_he, price_monthly, price_yearly, currency, trial_days, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Dashboard subscription plans GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

