import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const supabase = await createAdminClient();
  const sb = supabase as any;

  const { data: app, error: fetchErr } = await sb.from("business_applications").select("id").eq("id", id).eq("status", "pending").single();
  if (fetchErr || !app) return NextResponse.json({ message: "Application not found or not pending" }, { status: 404 });

  const { error } = await sb
    .from("business_applications")
    .update({
      status: "rejected",
      rejection_reason: body.reason ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.userId,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
