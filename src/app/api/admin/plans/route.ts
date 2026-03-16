import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const { data, error } = await sb.from("subscription_plans").select("id, name_en, slug").eq("is_active", true).order("sort_order");
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
