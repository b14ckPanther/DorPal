import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";

type PortalBody = { locale?: string };

export async function POST(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as PortalBody;
    const locale =
      body.locale && ["ar", "he", "en"].includes(body.locale)
        ? body.locale
        : "ar";

    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json(
        { message: "Stripe is not configured on this server." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: sub } = await sb
      .from("business_subscriptions")
      .select("external_subscription_id")
      .eq("business_id", ctx.businessId)
      .in("status", ["trialing", "active", "grace_period", "past_due"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.external_subscription_id) {
      return NextResponse.json(
        { message: "No Stripe subscription found for this business yet." },
        { status: 400 }
      );
    }

    const stripeSub = await stripe.subscriptions.retrieve(
      sub.external_subscription_id
    );
    const customerId =
      typeof stripeSub.customer === "string"
        ? stripeSub.customer
        : stripeSub.customer?.id;
    if (!customerId) {
      return NextResponse.json(
        { message: "No Stripe customer linked to this subscription." },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/${locale}/dashboard/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Dashboard subscription portal POST:", err);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}

