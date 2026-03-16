import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardBusinessId, getStaffForDashboard } from "@/lib/supabase/queries";

type BlockedSlotInput = { start_at: string; end_at: string; reason?: string | null };

type PatchPayload = {
  name_ar?: string | null;
  name_he?: string | null;
  name_en?: string;
  role_title_ar?: string | null;
  role_title_he?: string | null;
  role_title_en?: string | null;
  photo_url?: string | null;
  is_active?: boolean;
  is_visible_in_booking?: boolean;
  sort_order?: number;
  hours?: { day_of_week: number; start_time: string; end_time: string }[];
  blocked_slots?: BlockedSlotInput[];
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

    const { id } = await params;
    const body = (await req.json()) as PatchPayload;

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: existing } = await sb.from("staff_members").select("id, business_id, user_id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!existing) {
      return NextResponse.json({ message: "Staff not found" }, { status: 404 });
    }

    const isSelf = existing.user_id && (await supabase.auth.getUser()).data.user?.id === existing.user_id;
    const canWrite = ctx.isOwner || isSelf;

    const updatePayload: Record<string, unknown> = {};
    if (body.name_ar !== undefined) updatePayload.name_ar = body.name_ar;
    if (body.name_he !== undefined) updatePayload.name_he = body.name_he;
    if (body.name_en !== undefined) updatePayload.name_en = body.name_en;
    if (body.role_title_ar !== undefined) updatePayload.role_title_ar = body.role_title_ar;
    if (body.role_title_he !== undefined) updatePayload.role_title_he = body.role_title_he;
    if (body.role_title_en !== undefined) updatePayload.role_title_en = body.role_title_en;
    if (body.photo_url !== undefined) updatePayload.photo_url = body.photo_url;
    if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order;
    if (ctx.isOwner) {
      if (body.is_active !== undefined) updatePayload.is_active = body.is_active;
      if (body.is_visible_in_booking !== undefined) updatePayload.is_visible_in_booking = body.is_visible_in_booking;
    }

    if (Object.keys(updatePayload).length > 0 && canWrite) {
      const { error: updateError } = await sb.from("staff_members").update(updatePayload).eq("id", id);
      if (updateError) {
        console.error("Failed to update staff:", updateError.message);
        return NextResponse.json({ message: "Failed to update staff" }, { status: 500 });
      }
    }

    if (ctx.isOwner && body.hours !== undefined) {
      await sb.from("staff_hours").delete().eq("staff_id", id);
      if (body.hours.length > 0) {
        const rows = body.hours
          .filter((h) => h.start_time && h.end_time && h.start_time < h.end_time)
          .map((h) => ({
            staff_id: id,
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
          }));
        if (rows.length > 0) {
          await sb.from("staff_hours").insert(rows);
        }
      }
    }

    if (ctx.isOwner && body.blocked_slots !== undefined) {
      await sb.from("blocked_slots").delete().eq("business_id", ctx.businessId).eq("staff_id", id);
      if (body.blocked_slots.length > 0) {
        const rows = body.blocked_slots
          .filter((b) => b.start_at && b.end_at && b.start_at < b.end_at)
          .map((b) => ({
            business_id: ctx.businessId,
            staff_id: id,
            start_at: b.start_at,
            end_at: b.end_at,
            reason: b.reason ?? null,
          }));
        if (rows.length > 0) {
          await sb.from("blocked_slots").insert(rows);
        }
      }
    }

    const staff = await getStaffForDashboard(ctx.businessId);
    return NextResponse.json(staff);
  } catch (err) {
    console.error("Dashboard staff PATCH:", err);
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
      return NextResponse.json({ message: "Only the business owner can deactivate staff" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: existing } = await sb.from("staff_members").select("id").eq("id", id).eq("business_id", ctx.businessId).single();
    if (!existing) {
      return NextResponse.json({ message: "Staff not found" }, { status: 404 });
    }

    const { error } = await sb.from("staff_members").update({ is_active: false }).eq("id", id);
    if (error) {
      console.error("Failed to deactivate staff:", error.message);
      return NextResponse.json({ message: "Failed to deactivate staff" }, { status: 500 });
    }

    const staff = await getStaffForDashboard(ctx.businessId);
    return NextResponse.json(staff);
  } catch (err) {
    console.error("Dashboard staff DELETE:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
