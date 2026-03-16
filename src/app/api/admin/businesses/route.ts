import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const supabase = await createAdminClient();
  const sb = supabase as any;
  let query = sb.from("businesses").select("id, name_en, name_ar, slug, status, owner_id, created_at, profiles!owner_id(full_name, email)").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
