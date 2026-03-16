import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const actor_id = searchParams.get("actor_id") ?? "";
  const action = searchParams.get("action") ?? "";
  const entity_type = searchParams.get("entity_type") ?? "";
  const supabase = await createAdminClient();
  const sb = supabase as any;
  let query = sb.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, payload, created_at, profiles!actor_id(full_name)").order("created_at", { ascending: false }).limit(200);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (actor_id) query = query.eq("actor_id", actor_id);
  if (action) query = query.eq("action", action);
  if (entity_type) query = query.eq("entity_type", entity_type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
