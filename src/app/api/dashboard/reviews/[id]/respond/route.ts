import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx || !ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { id: reviewId } = await params;
    const body = (await req.json()) as { body_en: string; body_ar?: string; body_he?: string };
    if (!body.body_en) return NextResponse.json({ message: "body_en required" }, { status: 400 });
    const sb = supabase as any;
    const { data: review } = await sb.from("reviews").select("id, business_id").eq("id", reviewId).eq("business_id", ctx.businessId).single();
    if (!review) return NextResponse.json({ message: "Review not found" }, { status: 404 });
    const { data: existing } = await sb.from("review_responses").select("id").eq("review_id", reviewId).maybeSingle();
    if (existing) return NextResponse.json({ message: "Already responded" }, { status: 400 });
    const { error } = await sb.from("review_responses").insert({
      review_id: reviewId,
      business_id: ctx.businessId,
      body_en: body.body_en,
      body_ar: body.body_ar ?? null,
      body_he: body.body_he ?? null,
      created_by: user.id,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dashboard review respond:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
