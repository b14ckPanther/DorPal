import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json()) as { plan_id?: string; trial_ends_at?: string; status?: string };
  const supabase = await createAdminClient();
  const sb = supabase as any;
  const update: Record<string, unknown> = {};
  if (body.plan_id) update.plan_id = body.plan_id;
  if (body.trial_ends_at) update.trial_ends_at = body.trial_ends_at;
  if (body.status) update.status = body.status;
  if (Object.keys(update).length === 0) return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  const { error } = await sb.from("business_subscriptions").update(update).eq("id", id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  const { data } = await sb.from("business_subscriptions").select("*").eq("id", id).single();
  return NextResponse.json(data);
}
