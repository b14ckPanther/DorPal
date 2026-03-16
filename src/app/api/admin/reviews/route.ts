import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const supabase = await createAdminClient();
  const sb = supabase as any;
  let query = sb.from("reviews").select("id, business_id, rating, body_en, body_ar, body_he, status, created_at, profiles!customer_id(full_name), businesses(name_en, slug)").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
