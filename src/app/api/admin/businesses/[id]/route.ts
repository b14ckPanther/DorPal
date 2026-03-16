import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const { data: biz, error } = await sb.from("businesses").select("*, profiles!owner_id(full_name, email)").eq("id", id).single();
  if (error || !biz) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: notes } = await sb.from("admin_notes").select("id, body, created_at, created_by").eq("entity_type", "business").eq("entity_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ ...biz, admin_notes: notes ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { status?: string };
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (Object.keys(update).length > 0) {
    const { error } = await sb.from("businesses").update(update).eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  }
  const { data } = await sb.from("businesses").select("*").eq("id", id).single();
  return NextResponse.json(data);
}
