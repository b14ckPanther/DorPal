import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { capturePayPalOrder } from "@/lib/paypal/server";

async function triggerBookingNotification(appointmentId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;
  try {
    await fetch(`${url}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        type: "booking_confirmation",
        booking_id: appointmentId,
      }),
    });
  } catch (error) {
    console.error("Failed to trigger booking notification", error);
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("token");
  const appointmentId = req.nextUrl.searchParams.get("appointment_id");
  const paymentId = req.nextUrl.searchParams.get("payment_id");
  const locale = req.nextUrl.searchParams.get("locale") ?? "ar";
  const guestToken = req.nextUrl.searchParams.get("guest_token");

  const tokenQ = guestToken ? `&token=${encodeURIComponent(guestToken)}` : "";
  const baseRedirect = `${req.nextUrl.origin}/${locale}/booking/${appointmentId ?? ""}/confirm`;

  if (!orderId || !appointmentId || !paymentId) {
    return NextResponse.redirect(`${baseRedirect}?checkout=error${tokenQ}`);
  }

  const captured = await capturePayPalOrder(orderId);
  if (!captured) {
    return NextResponse.redirect(`${baseRedirect}?checkout=error${tokenQ}`);
  }

  const purchaseUnit = captured.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const isCompleted =
    captured.status === "COMPLETED" && capture?.status === "COMPLETED";
  const appointmentMatch = purchaseUnit?.custom_id === appointmentId;
  const paymentMatch = purchaseUnit?.invoice_id === paymentId;

  if (!isCompleted || !appointmentMatch || !paymentMatch) {
    return NextResponse.redirect(`${baseRedirect}?checkout=error${tokenQ}`);
  }

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { error: payErr } = await sb
    .from("payments")
    .update({
      status: "succeeded",
      paid_at: new Date().toISOString(),
      external_id: capture.id,
    })
    .eq("id", paymentId);

  const { error: aptErr } = await sb
    .from("appointments")
    .update({
      status: "confirmed",
      deposit_paid_at: new Date().toISOString(),
    })
    .eq("id", appointmentId);

  if (payErr || aptErr) {
    console.error("PayPal return update failed:", {
      payment: payErr?.message,
      appointment: aptErr?.message,
    });
    return NextResponse.redirect(`${baseRedirect}?checkout=error${tokenQ}`);
  }

  await triggerBookingNotification(appointmentId);
  return NextResponse.redirect(`${baseRedirect}?checkout=success${tokenQ}`);
}

