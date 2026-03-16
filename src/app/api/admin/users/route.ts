import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "";
  const supabase = await createAdminClient();
  const sb = supabase as any;
  let query = sb.from("profiles").select("id, full_name, email, phone, role, created_at").order("created_at", { ascending: false }).limit(300);
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
