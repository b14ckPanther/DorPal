import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getServicesForDashboard } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

type PatchPayload = {
  name_ar?: string | null;
  name_he?: string | null;
  name_en?: string;
  description_ar?: string | null;
  description_he?: string | null;
  description_en?: string | null;
  duration_minutes?: number;
  price?: number;
  deposit_required?: boolean;
  deposit_amount?: number | null;
  is_active?: boolean;
  sort_order?: number;
  staff_ids?: string[];
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!ctx.isOwner) {
      return NextResponse.json({ message: "Only the business owner can edit services" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as PatchPayload;

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: existing } = await sb.from("services").select("id, business_id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!existing) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (body.name_ar !== undefined) updatePayload.name_ar = body.name_ar;
    if (body.name_he !== undefined) updatePayload.name_he = body.name_he;
    if (body.name_en !== undefined) updatePayload.name_en = body.name_en;
    if (body.description_ar !== undefined) updatePayload.description_ar = body.description_ar;
    if (body.description_he !== undefined) updatePayload.description_he = body.description_he;
    if (body.description_en !== undefined) updatePayload.description_en = body.description_en;
    if (body.duration_minutes !== undefined) updatePayload.duration_minutes = body.duration_minutes;
    if (body.price !== undefined) updatePayload.price = body.price;
    if (body.deposit_required !== undefined) updatePayload.deposit_required = body.deposit_required;
    if (body.deposit_amount !== undefined) updatePayload.deposit_amount = body.deposit_amount;
    if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
    if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await sb.from("services").update(updatePayload).eq("id", id);
      if (updateError) {
        console.error("Failed to update service:", updateError.message);
        return NextResponse.json({ message: "Failed to update service" }, { status: 500 });
      }
    }

    if (body.staff_ids !== undefined) {
      await sb.from("staff_services").delete().eq("service_id", id);
      if (body.staff_ids.length > 0) {
        await sb.from("staff_services").insert(
          body.staff_ids.map((staff_id: string) => ({ service_id: id, staff_id }))
        );
      }
    }

    const services = await getServicesForDashboard(ctx.businessId);
    return NextResponse.json(services);
  } catch (err) {
    console.error("Dashboard services PATCH:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!ctx.isOwner) {
      return NextResponse.json({ message: "Only the business owner can deactivate services" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: existing } = await sb.from("services").select("id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!existing) {
      return NextResponse.json({ message: "Service not found" }, { status: 404 });
    }

    const { error } = await sb.from("services").update({ is_active: false }).eq("id", id);
    if (error) {
      console.error("Failed to deactivate service:", error.message);
      return NextResponse.json({ message: "Failed to deactivate service" }, { status: 500 });
    }

    const services = await getServicesForDashboard(ctx.businessId);
    return NextResponse.json(services);
  } catch (err) {
    console.error("Dashboard services DELETE:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
