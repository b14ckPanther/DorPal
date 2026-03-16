import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "business";
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = await createAdminClient();
  const sb = supabase as any;

  const { data: app, error: appErr } = await sb
    .from("business_applications")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();
  if (appErr || !app) return NextResponse.json({ message: "Application not found or not pending" }, { status: 404 });

  const email = app.applicant_email as string;
  const password = Math.random().toString(36).slice(-12) + "A1!";

  const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !newUser.user) {
    console.error("Admin createUser:", userErr);
    return NextResponse.json({ message: userErr?.message ?? "Failed to create user" }, { status: 500 });
  }

  const userId = newUser.user.id;
  await sb.from("profiles").upsert({
    id: userId,
    full_name: app.applicant_name,
    email: app.applicant_email,
    role: "business_owner",
  }, { onConflict: "id" });

  let slug = slugify(app.business_name_en || "business");
  const { data: existing } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
  if (existing) slug = `${slug}-${id.slice(0, 8)}`;

  const { data: business, error: bizErr } = await sb
    .from("businesses")
    .insert({
      owner_id: userId,
      category_id: app.category_id,
      locality_id: app.locality_id,
      name_ar: app.business_name_ar,
      name_he: app.business_name_he,
      name_en: app.business_name_en,
      slug,
      address: app.address,
      description_ar: app.description_ar,
      description_he: app.description_he,
      description_en: app.description_en,
      status: "active",
      created_by: admin.userId,
    })
    .select("id")
    .single();
  if (bizErr || !business) {
    console.error("Insert business:", bizErr);
    return NextResponse.json({ message: "Failed to create business" }, { status: 500 });
  }

  await sb.from("business_members").insert({
    business_id: business.id,
    user_id: userId,
    role: "owner",
    joined_at: new Date().toISOString(),
  });

  const desiredPlanSlug = (() => {
    const raw = app.admin_notes as string | null;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { desired_plan_slug?: string };
      return parsed.desired_plan_slug ?? null;
    } catch {
      return null;
    }
  })();

  let plan: { id: string; trial_days: number | null } | null = null;
  if (desiredPlanSlug) {
    const { data: desiredPlan } = await sb
      .from("subscription_plans")
      .select("id, trial_days")
      .eq("is_active", true)
      .eq("slug", desiredPlanSlug)
      .maybeSingle();
    plan = desiredPlan ?? null;
  }
  if (!plan) {
    const { data: fallbackPlan } = await sb
      .from("subscription_plans")
      .select("id, trial_days")
      .eq("is_active", true)
      .order("sort_order")
      .limit(1)
      .single();
    plan = fallbackPlan ?? null;
  }

  if (plan) {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (plan.trial_days || 14));
    const trialEnd = new Date(end);
    await sb.from("business_subscriptions").insert({
      business_id: business.id,
      plan_id: plan.id,
      status: "trialing",
      current_period_start: start.toISOString().slice(0, 10),
      current_period_end: end.toISOString().slice(0, 10),
      trial_ends_at: trialEnd.toISOString().slice(0, 10),
      created_by: admin.userId,
    });
  }

  await sb
    .from("business_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.userId,
      converted_business_id: business.id,
    })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    business_id: business.id,
    credentials: { email, password },
  });
}
