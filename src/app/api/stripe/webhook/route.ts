import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!sig) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const appointmentId = intent.metadata.appointment_id;
    const paymentId = intent.metadata.payment_id;

    if (appointmentId && paymentId) {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      await sb
        .from("payments")
        .update({
          status: "succeeded",
          paid_at: new Date().toISOString(),
          external_id: intent.id,
        })
        .eq("id", paymentId);

      await sb
        .from("appointments")
        .update({
          status: "confirmed",
          deposit_paid_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);
    }
  }

  return NextResponse.json({ received: true });
}

