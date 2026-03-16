import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardBusinessId, getStaffForDashboard } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const staff = await getStaffForDashboard(ctx.businessId);
    return NextResponse.json(staff);
  } catch (err) {
    console.error("Dashboard staff GET:", err);
    return NextResponse.json({ message: "Failed to load staff" }, { status: 500 });
  }
}

type CreatePayload = {
  name_ar?: string | null;
  name_he?: string | null;
  name_en: string;
  role_title_ar?: string | null;
  role_title_he?: string | null;
  role_title_en?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  is_visible_in_booking?: boolean;
  sort_order?: number;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!ctx.isOwner) {
      return NextResponse.json({ message: "Only the business owner can add staff" }, { status: 403 });
    }

    const body = (await req.json()) as CreatePayload;
    if (!body.name_en) {
      return NextResponse.json({ message: "Missing required field: name_en" }, { status: 400 });
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: limitData } = await sb.rpc("get_plan_feature_value", {
      p_business_id: ctx.businessId,
      p_feature_key: "max_staff",
    });
    const limitVal = Array.isArray(limitData) ? limitData[0] : limitData;
    const maxStaff = (typeof limitVal === "number" && !Number.isNaN(limitVal)) ? limitVal : (Number(limitVal) || 999);
    const { count } = await sb.from("staff_members").select("id", { count: "exact", head: true }).eq("business_id", ctx.businessId).eq("is_active", true);
    if ((count ?? 0) >= maxStaff) {
      return NextResponse.json({ message: `Staff limit reached (max ${maxStaff})` }, { status: 403 });
    }

    const insertPayload = {
      business_id: ctx.businessId,
      name_ar: body.name_ar ?? null,
      name_he: body.name_he ?? null,
      name_en: body.name_en,
      role_title_ar: body.role_title_ar ?? null,
      role_title_he: body.role_title_he ?? null,
      role_title_en: body.role_title_en ?? null,
      photo_url: body.photo_url ?? null,
      is_active: body.is_active ?? true,
      is_visible_in_booking: body.is_visible_in_booking ?? true,
      sort_order: body.sort_order ?? 0,
    };

    const { data: newStaff, error: insertError } = await sb.from("staff_members").insert(insertPayload).select("id").single();
    if (insertError) {
      console.error("Failed to create staff:", insertError.message);
      return NextResponse.json({ message: "Failed to create staff" }, { status: 500 });
    }

    const staff = await getStaffForDashboard(ctx.businessId);
    return NextResponse.json(staff);
  } catch (err) {
    console.error("Dashboard staff POST:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
