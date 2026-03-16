import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardBusinessId, getServicesForDashboard } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const services = await getServicesForDashboard(ctx.businessId);
    return NextResponse.json(services);
  } catch (err) {
    console.error("Dashboard services GET:", err);
    return NextResponse.json({ message: "Failed to load services" }, { status: 500 });
  }
}

type CreatePayload = {
  name_ar?: string | null;
  name_he?: string | null;
  name_en: string;
  description_ar?: string | null;
  description_he?: string | null;
  description_en?: string | null;
  duration_minutes: number;
  price: number;
  deposit_required?: boolean;
  deposit_amount?: number | null;
  is_active?: boolean;
  sort_order?: number;
  staff_ids?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!ctx.isOwner) {
      return NextResponse.json({ message: "Only the business owner can add services" }, { status: 403 });
    }

    const body = (await req.json()) as CreatePayload;
    if (!body.name_en || body.duration_minutes == null || body.price == null) {
      return NextResponse.json({ message: "Missing required fields: name_en, duration_minutes, price" }, { status: 400 });
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: limitData } = await sb.rpc("get_plan_feature_value", {
      p_business_id: ctx.businessId,
      p_feature_key: "max_services",
    });
    const limitVal = Array.isArray(limitData) ? limitData[0] : limitData;
    const maxServices = (typeof limitVal === "number" && !Number.isNaN(limitVal)) ? limitVal : (Number(limitVal) || 999);
    const { count } = await sb.from("services").select("id", { count: "exact", head: true }).eq("business_id", ctx.businessId).eq("is_active", true);
    if ((count ?? 0) >= maxServices) {
      return NextResponse.json({ message: `Service limit reached (max ${maxServices})` }, { status: 403 });
    }

    const insertPayload = {
      business_id: ctx.businessId,
      name_ar: body.name_ar ?? null,
      name_he: body.name_he ?? null,
      name_en: body.name_en,
      description_ar: body.description_ar ?? null,
      description_he: body.description_he ?? null,
      description_en: body.description_en ?? null,
      duration_minutes: body.duration_minutes,
      price: body.price,
      deposit_required: body.deposit_required ?? false,
      deposit_amount: body.deposit_required ? (body.deposit_amount ?? 0) : null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    };

    const { data: newService, error: insertError } = await sb.from("services").insert(insertPayload).select("id").single();
    if (insertError) {
      console.error("Failed to create service:", insertError.message);
      return NextResponse.json({ message: "Failed to create service" }, { status: 500 });
    }

    const staffIds = body.staff_ids ?? [];
    if (staffIds.length > 0) {
      const links = staffIds.map((staff_id: string) => ({
        service_id: newService.id,
        staff_id,
      }));
      await sb.from("staff_services").insert(links);
    }

    const services = await getServicesForDashboard(ctx.businessId);
    return NextResponse.json(services);
  } catch (err) {
    console.error("Dashboard services POST:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
