import Stripe from "stripe";

export type BillingCycle = "monthly" | "yearly";

let stripeInstance: Stripe | null = null;

export function getStripeServerClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(secret);
  }
  return stripeInstance;
}

export function getStripePriceIdForPlan(
  planSlug: string,
  billingCycle: BillingCycle
) {
  const normalizedSlug = planSlug.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const cycle = billingCycle === "yearly" ? "YEARLY" : "MONTHLY";
  const key = `STRIPE_PRICE_${normalizedSlug}_${cycle}`;
  return process.env[key] ?? null;
}

