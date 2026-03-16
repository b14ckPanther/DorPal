import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getOffersForDashboard } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const list = await getOffersForDashboard(ctx.businessId);
    return NextResponse.json(list);
  } catch (err) {
    console.error("Dashboard offers GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as {
      title_ar?: string | null; title_he?: string | null; title_en: string;
      description_ar?: string | null; description_he?: string | null; description_en?: string | null;
      discount_type: string; discount_value: number; start_at: string; end_at: string;
      status?: string; is_visible?: boolean;
    };
    if (!body.title_en || body.discount_type == null || body.discount_value == null || !body.start_at || !body.end_at) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    const supabase = await createClient();
    const sb = supabase as any;
    const { data: limitData } = await sb.rpc("get_plan_feature_value", { p_business_id: ctx.businessId, p_feature_key: "max_offers" });
    const limitVal = Array.isArray(limitData) ? limitData[0] : limitData;
    const maxOffers = (typeof limitVal === "number" && !Number.isNaN(limitVal)) ? limitVal : (Number(limitVal) || 99);
    const { count } = await sb.from("offers").select("id", { count: "exact", head: true }).eq("business_id", ctx.businessId).eq("status", "active");
    if ((count ?? 0) >= maxOffers) return NextResponse.json({ message: `Offer limit (${maxOffers}) reached` }, { status: 403 });
    const { error } = await sb.from("offers").insert({
      business_id: ctx.businessId,
      title_ar: body.title_ar ?? null,
      title_he: body.title_he ?? null,
      title_en: body.title_en,
      description_ar: body.description_ar ?? null,
      description_he: body.description_he ?? null,
      description_en: body.description_en ?? null,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      start_at: body.start_at,
      end_at: body.end_at,
      status: body.status ?? "active",
      is_visible: body.is_visible ?? true,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    const list = await getOffersForDashboard(ctx.businessId);
    return NextResponse.json(list);
  } catch (err) {
    console.error("Dashboard offers POST:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
