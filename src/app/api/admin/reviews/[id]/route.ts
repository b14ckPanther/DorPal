import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { status: string; reason?: string };
  if (!body.status || !["published", "hidden", "removed"].includes(body.status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const { data: review } = await sb.from("reviews").select("id, status, business_id").eq("id", id).single();
  if (!review) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { error } = await sb.from("reviews").update({
    status: body.status,
    moderated_at: new Date().toISOString(),
    moderated_by: admin.userId,
  }).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  await sb.from("moderation_actions").insert({
    entity_type: "review",
    entity_id: id,
    action: "status_change",
    previous_value: { status: review.status },
    new_value: { status: body.status },
    reason: body.reason ?? null,
    created_by: admin.userId,
  });
  return NextResponse.json({ ok: true });
}
