import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const { data: profile, error } = await sb.from("profiles").select("*").eq("id", id).single();
  if (error || !profile) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { data: notes } = await sb.from("admin_notes").select("id, body, created_at").eq("entity_type", "profile").eq("entity_id", id).order("created_at", { ascending: false });
  return NextResponse.json({ ...profile, admin_notes: notes ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { action: string; password?: string };
  const supabase = await createAdminClient();
  if (body.action === "reset_password" && body.password) {
    const { error } = await supabase.auth.admin.updateUserById(id, { password: body.password });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ message: "Invalid action" }, { status: 400 });
}
