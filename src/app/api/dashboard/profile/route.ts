import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BusinessHour } from "@/lib/supabase/queries";

type Payload = {
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  description_ar: string | null;
  description_he: string | null;
  description_en: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  waze_url: string | null;
  locality_id: string;
  category_id: string;
  hours: BusinessHour[];
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<Payload>;

    if (!body.name_en || !body.locality_id || !body.category_id) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Only owners can update the business profile and hours
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: biz, error: bizError } = await sb
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (bizError) {
      console.error("Failed to resolve business for owner:", bizError.message);
      return NextResponse.json({ message: "Failed to resolve business" }, { status: 500 });
    }

    if (!biz?.id) {
      return NextResponse.json({ message: "Business not found for owner" }, { status: 404 });
    }

    const businessId = biz.id as string;

    const updatePayload = {
      name_ar: body.name_ar ?? null,
      name_he: body.name_he ?? null,
      name_en: body.name_en,
      description_ar: body.description_ar ?? null,
      description_he: body.description_he ?? null,
      description_en: body.description_en ?? null,
      logo_url: body.logo_url ?? null,
      cover_url: body.cover_url ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      email: body.email ?? null,
      instagram_url: body.instagram_url ?? null,
      tiktok_url: body.tiktok_url ?? null,
      facebook_url: body.facebook_url ?? null,
      waze_url: body.waze_url ?? null,
      locality_id: body.locality_id,
      category_id: body.category_id,
    };

    const { error: updateError } = await sb
      .from("businesses")
      .update(updatePayload)
      .eq("id", businessId);

    if (updateError) {
      console.error("Failed to update business profile:", updateError.message);
      return NextResponse.json({ message: "Failed to update business" }, { status: 500 });
    }

    const incomingHours = (body.hours ?? []) as BusinessHour[];

    // Replace-all pattern for business_hours (root business, no branches)
    const { error: deleteError } = await sb
      .from("business_hours")
      .delete()
      .eq("business_id", businessId)
      .is("branch_id", null);

    if (deleteError) {
      console.error("Failed to clear business hours:", deleteError.message);
      return NextResponse.json({ message: "Failed to update hours" }, { status: 500 });
    }

    const rowsToInsert = incomingHours.map((h) => {
      const isClosed = !!h.is_closed;

      // business_hours.start_time / end_time are NOT NULL, but constraint
      // allows any values when is_closed = true.
      const start =
        h.start_time && !isClosed
          ? h.start_time
          : h.start_time ?? "00:00";
      const end =
        h.end_time && !isClosed
          ? h.end_time
          : h.end_time ?? "00:00";

      return {
        business_id: businessId,
        branch_id: null,
        day_of_week: h.day_of_week,
        start_time: start,
        end_time: end,
        is_closed: isClosed,
      };
    });

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await sb.from("business_hours").insert(rowsToInsert);
      if (insertError) {
        console.error("Failed to insert business hours:", insertError.message);
        return NextResponse.json({ message: "Failed to save hours" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error in dashboard profile API:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

