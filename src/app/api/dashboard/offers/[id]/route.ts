import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getOffersForDashboard } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx || !ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const supabase = await createClient();
    const sb = supabase as any;
    const { data: row } = await sb.from("offers").select("id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    const update: Record<string, unknown> = {};
    const allowed = ["title_ar", "title_he", "title_en", "description_ar", "description_he", "description_en", "discount_type", "discount_value", "start_at", "end_at", "status", "is_visible"];
    allowed.forEach((k) => { if (body[k] !== undefined) update[k] = body[k]; });
    if (Object.keys(update).length === 0) return NextResponse.json(await getOffersForDashboard(ctx.businessId));
    const { error } = await sb.from("offers").update(update).eq("id", id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json(await getOffersForDashboard(ctx.businessId));
  } catch (err) {
    console.error("Dashboard offers PATCH:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx || !ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const supabase = await createClient();
    const sb = supabase as any;
    const { data: row } = await sb.from("offers").select("id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!row) return NextResponse.json({ message: "Not found" }, { status: 404 });
    await sb.from("offers").update({ status: "deactivated" }).eq("id", id);
    return NextResponse.json(await getOffersForDashboard(ctx.businessId));
  } catch (err) {
    console.error("Dashboard offers DELETE:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
