import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { body: string };
  if (!body.body?.trim()) return NextResponse.json({ message: "body required" }, { status: 400 });
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const { error } = await sb.from("admin_notes").insert({
    entity_type: "business",
    entity_id: id,
    body: body.body.trim(),
    is_internal: true,
    created_by: admin.userId,
  });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  const { data } = await sb.from("admin_notes").select("*").eq("entity_type", "business").eq("entity_id", id).order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
