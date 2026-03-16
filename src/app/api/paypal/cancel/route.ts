import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const appointmentId = req.nextUrl.searchParams.get("appointment_id");
  const paymentId = req.nextUrl.searchParams.get("payment_id");
  const locale = req.nextUrl.searchParams.get("locale") ?? "ar";
  const guestToken = req.nextUrl.searchParams.get("guest_token");

  if (paymentId) {
    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    await sb
      .from("payments")
      .update({
        status: "failed",
      })
      .eq("id", paymentId)
      .eq("status", "pending");
  }

  const tokenQ = guestToken ? `&token=${encodeURIComponent(guestToken)}` : "";
  return NextResponse.redirect(
    `${req.nextUrl.origin}/${locale}/booking/${appointmentId ?? ""}/confirm?checkout=cancel${tokenQ}`
  );
}

