import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import {
  getStripePriceIdForPlan,
  getStripeServerClient,
  type BillingCycle,
} from "@/lib/stripe/server";

type CheckoutBody = {
  planSlug?: string;
  billingCycle?: BillingCycle;
  locale?: string;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as CheckoutBody;
    const planSlug = body.planSlug?.trim().toLowerCase();
    const billingCycle: BillingCycle =
      body.billingCycle === "yearly" ? "yearly" : "monthly";
    const locale =
      body.locale && ["ar", "he", "en"].includes(body.locale)
        ? body.locale
        : "ar";

    if (!planSlug) {
      return NextResponse.json({ message: "Missing planSlug" }, { status: 400 });
    }

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { message: "Stripe is not configured on this server." },
        { status: 503 }
      );
    }

    const priceId = getStripePriceIdForPlan(planSlug, billingCycle);
    if (!priceId) {
      return NextResponse.json(
        {
          message: `Missing Stripe price mapping for ${planSlug} (${billingCycle}).`,
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: plan, error: planErr } = await sb
      .from("subscription_plans")
      .select("id, slug")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .single();
    if (planErr || !plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    const { data: existing } = await sb
      .from("business_subscriptions")
      .select("id, external_subscription_id")
      .eq("business_id", ctx.businessId)
      .in("status", ["trialing", "active", "grace_period", "past_due"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId: string | undefined;
    if (existing?.external_subscription_id) {
      try {
        const existingStripeSub = await stripe.subscriptions.retrieve(
          existing.external_subscription_id
        );
        customerId =
          typeof existingStripeSub.customer === "string"
            ? existingStripeSub.customer
            : existingStripeSub.customer?.id;
      } catch (err) {
        console.error("Failed to resolve Stripe customer from subscription:", err);
      }
    }

    const origin = req.nextUrl.origin;
    const success_url = `${origin}/${locale}/dashboard/subscription?checkout=success`;
    const cancel_url = `${origin}/${locale}/dashboard/subscription?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user?.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url,
      cancel_url,
      allow_promotion_codes: true,
      metadata: {
        business_id: ctx.businessId,
        plan_id: plan.id,
        plan_slug: plan.slug,
        billing_cycle: billingCycle,
        existing_subscription_id: existing?.id ?? "",
      },
      subscription_data: {
        metadata: {
          business_id: ctx.businessId,
          plan_id: plan.id,
          plan_slug: plan.slug,
          billing_cycle: billingCycle,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { message: "Stripe checkout session URL is missing." },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Dashboard subscription checkout POST:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

