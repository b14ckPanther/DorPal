import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

function toDateOnly(unixSeconds?: number | null) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "cancelled";
    default:
      return "grace_period";
  }
}

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

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const appointmentId = intent.metadata.appointment_id;
    const paymentId = intent.metadata.payment_id;

    if (appointmentId && paymentId) {
      const { error: payErr } = await sb
        .from("payments")
        .update({
          status: "succeeded",
          paid_at: new Date().toISOString(),
          external_id: intent.id,
        })
        .eq("id", paymentId);

      const { error: aptErr } = await sb
        .from("appointments")
        .update({
          status: "confirmed",
          deposit_paid_at: new Date().toISOString(),
        })
        .eq("id", appointmentId);

      if (payErr) console.error("Stripe webhook payment update failed:", payErr.message);
      if (aptErr) console.error("Stripe webhook appointment update failed:", aptErr.message);
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription") {
      const businessId = session.metadata?.business_id;
      const planId = session.metadata?.plan_id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      if (businessId && planId && subscriptionId && customerId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodStart = toDateOnly(subscription.current_period_start);
        const periodEnd = toDateOnly(subscription.current_period_end);
        const trialEnd = toDateOnly(subscription.trial_end);
        const stripeStatus = mapSubscriptionStatus(subscription.status);
        const { data: existing } = await sb
          .from("business_subscriptions")
          .select("id")
          .eq("business_id", businessId)
          .in("status", ["trialing", "active", "grace_period", "past_due"])
          .order("current_period_end", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await sb
            .from("business_subscriptions")
            .update({
              plan_id: planId,
              status: stripeStatus,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              trial_ends_at: trialEnd,
              external_subscription_id: subscriptionId,
            })
            .eq("id", existing.id);
          if (error) {
            console.error("Stripe webhook subscription update failed:", error.message);
          }
        } else {
          const { error } = await sb
            .from("business_subscriptions")
            .insert({
              business_id: businessId,
              plan_id: planId,
              status: stripeStatus,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              trial_ends_at: trialEnd,
              external_subscription_id: subscriptionId,
            });
          if (error) {
            console.error("Stripe webhook subscription insert failed:", error.message);
          }
        }
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const mapped = mapSubscriptionStatus(sub.status);
    const periodStart = toDateOnly(sub.current_period_start);
    const periodEnd = toDateOnly(sub.current_period_end);
    const trialEnd = toDateOnly(sub.trial_end);
    const { error } = await sb
      .from("business_subscriptions")
      .update({
        status: mapped,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        trial_ends_at: trialEnd,
        canceled_at:
          mapped === "cancelled" ? new Date().toISOString() : null,
      })
      .eq("external_subscription_id", sub.id);
    if (error) {
      console.error("Stripe webhook customer.subscription update failed:", error.message);
    }
  }

  if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;
    if (subscriptionId) {
      const { error } = await sb
        .from("business_subscriptions")
        .update({
          status: event.type === "invoice.paid" ? "active" : "past_due",
        })
        .eq("external_subscription_id", subscriptionId);
      if (error) {
        console.error("Stripe webhook invoice subscription update failed:", error.message);
      }
    }
  }

  return NextResponse.json({ received: true });
}

