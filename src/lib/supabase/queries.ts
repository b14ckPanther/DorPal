import { createClient } from "@/lib/supabase/server";

export interface Locality {
  id: string;
  name_ar: string;
  name_he: string;
  name_en: string;
  slug: string;
  region: string | null;
}

export interface Category {
  id: string;
  name_ar: string;
  name_he: string;
  name_en: string;
  slug: string;
}

export interface PublicSubscriptionPlan {
  id: string;
  slug: string;
  name_ar: string;
  name_he: string;
  name_en: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  trial_days: number;
  sort_order: number;
}

export interface ServicePreview {
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  price: number;
}

export interface BusinessListing {
  id: string;
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  slug: string;
  cover_url: string | null;
  logo_url: string | null;
  rating_avg: number;
  rating_count: number;
  status: string;
  category: Category;
  locality: Locality;
  services: ServicePreview[];
}

export interface ReviewListing {
  id: string;
  rating: number;
  body_ar: string | null;
  body_he: string | null;
  body_en: string | null;
  customer_name: string | null;
  business_name_ar: string | null;
  business_name_he: string | null;
  business_name_en: string;
  business_slug: string;
  created_at: string;
}

export async function getLocalities(): Promise<Locality[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select("id, name_ar, name_he, name_en, slug, region")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch localities:", error.message);
    return [];
  }
  return (data ?? []) as Locality[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_categories")
    .select("id, name_ar, name_he, name_en, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function getPublicSubscriptionPlans(): Promise<PublicSubscriptionPlan[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("subscription_plans")
    .select("id, slug, name_ar, name_he, name_en, price_monthly, price_yearly, currency, trial_days, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch subscription plans:", error.message);
    return [];
  }
  return (data ?? []) as PublicSubscriptionPlan[];
}

export async function getActiveBusinesses(limit = 50): Promise<BusinessListing[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from("businesses")
    .select(
      `id, name_ar, name_he, name_en, slug, cover_url, logo_url,
       rating_avg, rating_count, status,
       business_categories(id, name_ar, name_he, name_en, slug),
       localities(id, name_ar, name_he, name_en, slug, region),
       services(name_ar, name_he, name_en, price, is_active)`
    )
    .eq("status", "active")
    .order("rating_avg", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch businesses:", error.message);
    return [];
  }

  return ((rawData ?? []) as Record<string, unknown>[]).map((b) => {
    const cat = Array.isArray(b.business_categories)
      ? (b.business_categories[0] as Category)
      : (b.business_categories as Category);
    const loc = Array.isArray(b.localities)
      ? (b.localities[0] as Locality)
      : (b.localities as Locality);
    const rawServices = (b.services as Record<string, unknown>[]) ?? [];

    return {
      id: b.id as string,
      name_ar: b.name_ar as string | null,
      name_he: b.name_he as string | null,
      name_en: b.name_en as string,
      slug: b.slug as string,
      cover_url: b.cover_url as string | null,
      logo_url: b.logo_url as string | null,
      rating_avg: b.rating_avg as number,
      rating_count: b.rating_count as number,
      status: b.status as string,
      category: cat,
      locality: loc,
      services: rawServices
        .filter((s) => s.is_active)
        .slice(0, 3)
        .map((s) => ({
          name_ar: s.name_ar as string | null,
          name_he: s.name_he as string | null,
          name_en: s.name_en as string,
          price: s.price as number,
        })),
    } satisfies BusinessListing;
  });
}

export interface BusinessHour {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_closed: boolean;
}

export interface StaffMember {
  id: string;
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  role_title_ar: string | null;
  role_title_he: string | null;
  role_title_en: string | null;
  photo_url: string | null;
}

export interface Service {
  id: string;
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  description_ar: string | null;
  description_he: string | null;
  description_en: string | null;
  duration_minutes: number;
  price: number;
  deposit_required: boolean;
  deposit_amount: number | null;
}

export interface BusinessOffer {
  id: string;
  title_ar: string | null;
  title_he: string | null;
  title_en: string;
  description_ar: string | null;
  description_he: string | null;
  description_en: string | null;
}

export interface BusinessReview {
  id: string;
  rating: number;
  body_ar: string | null;
  body_he: string | null;
  body_en: string | null;
  customer_name: string | null;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  owner_id?: string;
  name_ar: string | null;
  name_he: string | null;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_he: string | null;
  description_en: string | null;
  cover_url: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  waze_url?: string | null;
  rating_avg: number;
  rating_count: number;
  category: Category & { id?: string };
  locality: Locality & { id?: string };
  services: Service[];
  staff: StaffMember[];
  hours: BusinessHour[];
  offers: BusinessOffer[];
  reviews: BusinessReview[];
}

export async function getBusinessBySlug(slug: string): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawBiz, error } = await (supabase as any)
    .from("businesses")
    .select(
      `id, name_ar, name_he, name_en, slug, description_ar, description_he, description_en,
       cover_url, logo_url, address, phone, whatsapp, email,
       instagram_url, tiktok_url, facebook_url, waze_url,
       rating_avg, rating_count, status,
       business_categories(id, name_ar, name_he, name_en, slug),
       localities(id, name_ar, name_he, name_en, slug, region)`
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  const biz = rawBiz as Record<string, unknown> | null;

  if (error || !biz) {
    if (error) console.error("Failed to fetch business:", error.message);
    return null;
  }

  const cat = Array.isArray(biz.business_categories)
    ? (biz.business_categories[0] as Category)
    : (biz.business_categories as Category);
  const loc = Array.isArray(biz.localities)
    ? (biz.localities[0] as Locality)
    : (biz.localities as Locality);

  const bizId = biz.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const [
    { data: servicesData },
    { data: staffData },
    { data: hoursData },
    { data: offersData },
    { data: reviewsData },
  ] = await Promise.all([
    sb.from("services")
      .select("id, name_ar, name_he, name_en, description_ar, description_he, description_en, duration_minutes, price, deposit_required, deposit_amount")
      .eq("business_id", bizId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    sb.from("staff_members")
      .select("id, name_ar, name_he, name_en, role_title_ar, role_title_he, role_title_en, photo_url")
      .eq("business_id", bizId)
      .eq("is_active", true)
      .eq("is_visible_in_booking", true)
      .order("sort_order", { ascending: true }),
    sb.from("business_hours")
      .select("day_of_week, start_time, end_time, is_closed")
      .eq("business_id", bizId)
      .is("branch_id", null)
      .order("day_of_week", { ascending: true }),
    sb.from("offers")
      .select("id, title_ar, title_he, title_en, description_ar, description_he, description_en")
      .eq("business_id", bizId)
      .eq("status", "active")
      .eq("is_visible", true)
      .gt("end_at", new Date().toISOString()),
    sb.from("reviews")
      .select("id, rating, body_ar, body_he, body_en, created_at, profiles!customer_id(full_name)")
      .eq("business_id", bizId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const reviews: BusinessReview[] = ((reviewsData ?? []) as Record<string, unknown>[]).map((r) => {
    const profile = Array.isArray(r.profiles)
      ? (r.profiles[0] as Record<string, unknown>)
      : (r.profiles as Record<string, unknown>);
    return {
      id: r.id as string,
      rating: r.rating as number,
      body_ar: r.body_ar as string | null,
      body_he: r.body_he as string | null,
      body_en: r.body_en as string | null,
      customer_name: profile?.full_name as string | null,
      created_at: r.created_at as string,
    };
  });

  return {
    id: biz.id as string,
    name_ar: biz.name_ar as string | null,
    name_he: biz.name_he as string | null,
    name_en: biz.name_en as string,
    slug: biz.slug as string,
    description_ar: biz.description_ar as string | null,
    description_he: biz.description_he as string | null,
    description_en: biz.description_en as string | null,
    cover_url: biz.cover_url as string | null,
    logo_url: biz.logo_url as string | null,
    address: biz.address as string | null,
    phone: biz.phone as string | null,
    whatsapp: biz.whatsapp as string | null,
    email: biz.email as string | null,
    instagram_url: (biz as any).instagram_url as string | null,
    tiktok_url: (biz as any).tiktok_url as string | null,
    facebook_url: (biz as any).facebook_url as string | null,
    waze_url: (biz as any).waze_url as string | null,
    rating_avg: biz.rating_avg as number,
    rating_count: biz.rating_count as number,
    category: cat,
    locality: loc,
    services: (servicesData ?? []) as Service[],
    staff: (staffData ?? []) as StaffMember[],
    hours: (hoursData ?? []) as BusinessHour[],
    offers: (offersData ?? []) as BusinessOffer[],
    reviews,
  };
}

/**
 * Resolve "my business" for the authenticated dashboard user (owner or staff)
 * and load core profile fields plus opening hours.
 */
export async function getMyBusinessForDashboard(): Promise<BusinessProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Failed to resolve auth user for dashboard:", userError?.message);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // First try owner
  const { data: ownerBiz } = await sb
    .from("businesses")
    .select(
      `id, owner_id, name_ar, name_he, name_en, slug,
       description_ar, description_he, description_en,
       cover_url, logo_url, address, phone, whatsapp, email,
       instagram_url, tiktok_url, facebook_url, waze_url,
       rating_avg, rating_count, status,
       business_categories(id, name_ar, name_he, name_en, slug),
       localities(id, name_ar, name_he, name_en, slug, region)`
    )
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  let bizRecord = ownerBiz as Record<string, unknown> | null;

  // If not owner, try staff/business member
  if (!bizRecord) {
    const { data: membership } = await sb
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!membership?.business_id) {
      return null;
    }

    const { data: staffBiz, error: staffBizError } = await sb
      .from("businesses")
      .select(
        `id, owner_id, name_ar, name_he, name_en, slug,
         description_ar, description_he, description_en,
         cover_url, logo_url, address, phone, whatsapp, email,
         instagram_url, tiktok_url, facebook_url, waze_url,
         rating_avg, rating_count, status,
         business_categories(id, name_ar, name_he, name_en, slug),
         localities(id, name_ar, name_he, name_en, slug, region)`
      )
      .eq("id", membership.business_id)
      .maybeSingle();

    if (staffBizError || !staffBiz) {
      console.error("Failed to fetch staff business for dashboard:", staffBizError?.message);
      return null;
    }

    bizRecord = staffBiz as Record<string, unknown>;
  }

  if (!bizRecord) return null;

  const cat = Array.isArray(bizRecord.business_categories)
    ? (bizRecord.business_categories[0] as Category & { id?: string })
    : (bizRecord.business_categories as Category & { id?: string });

  const loc = Array.isArray(bizRecord.localities)
    ? (bizRecord.localities[0] as Locality & { id?: string })
    : (bizRecord.localities as Locality & { id?: string });

  const bizId = bizRecord.id as string;

  const [{ data: hoursData }] = await Promise.all([
    sb
      .from("business_hours")
      .select("day_of_week, start_time, end_time, is_closed")
      .eq("business_id", bizId)
      .is("branch_id", null)
      .order("day_of_week", { ascending: true }),
  ]);

  return {
    id: bizRecord.id as string,
    owner_id: bizRecord.owner_id as string | undefined,
    name_ar: bizRecord.name_ar as string | null,
    name_he: bizRecord.name_he as string | null,
    name_en: bizRecord.name_en as string,
    slug: bizRecord.slug as string,
    description_ar: bizRecord.description_ar as string | null,
    description_he: bizRecord.description_he as string | null,
    description_en: bizRecord.description_en as string | null,
    cover_url: bizRecord.cover_url as string | null,
    logo_url: bizRecord.logo_url as string | null,
    address: bizRecord.address as string | null,
    phone: bizRecord.phone as string | null,
    whatsapp: bizRecord.whatsapp as string | null,
    email: bizRecord.email as string | null,
    instagram_url: (bizRecord as any).instagram_url as string | null,
    tiktok_url: (bizRecord as any).tiktok_url as string | null,
    facebook_url: (bizRecord as any).facebook_url as string | null,
    waze_url: (bizRecord as any).waze_url as string | null,
    rating_avg: (bizRecord as any).rating_avg as number ?? 0,
    rating_count: (bizRecord as any).rating_count as number ?? 0,
    category: cat,
    locality: loc,
    services: [],
    staff: [],
    hours: (hoursData ?? []) as BusinessHour[],
    offers: [],
    reviews: [],
  };
}

export interface ApplicationItem {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  business_name_en: string;
  business_name_ar: string | null;
  category_name_ar: string;
  category_name_en: string;
  locality_name_ar: string;
  locality_name_en: string;
  address: string | null;
  description_en: string | null;
  status: string;
  submitted_at: string;
  rejection_reason: string | null;
  desired_plan_slug: string | null;
}

export async function getApplications(): Promise<ApplicationItem[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from("business_applications")
    .select(
      `id, applicant_name, applicant_email, applicant_phone,
       business_name_en, business_name_ar, address, description_en,
       status, submitted_at, rejection_reason, admin_notes,
       business_categories(name_ar, name_en),
       localities(name_ar, name_en)`
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch applications:", error.message);
    return [];
  }

  return ((rawData ?? []) as Record<string, unknown>[]).map((a) => {
    const cat = Array.isArray(a.business_categories)
      ? (a.business_categories[0] as Record<string, unknown>)
      : (a.business_categories as Record<string, unknown>);
    const loc = Array.isArray(a.localities)
      ? (a.localities[0] as Record<string, unknown>)
      : (a.localities as Record<string, unknown>);
    return {
      id: a.id as string,
      applicant_name: a.applicant_name as string,
      applicant_email: a.applicant_email as string,
      applicant_phone: a.applicant_phone as string | null,
      business_name_en: a.business_name_en as string,
      business_name_ar: a.business_name_ar as string | null,
      address: a.address as string | null,
      description_en: a.description_en as string | null,
      status: a.status as string,
      submitted_at: a.submitted_at as string,
      rejection_reason: a.rejection_reason as string | null,
      desired_plan_slug: (() => {
        const raw = a.admin_notes as string | null;
        if (!raw) return null;
        try {
          const parsed = JSON.parse(raw) as { desired_plan_slug?: string };
          return parsed.desired_plan_slug ?? null;
        } catch {
          return null;
        }
      })(),
      category_name_ar: cat?.name_ar as string ?? "",
      category_name_en: cat?.name_en as string ?? "",
      locality_name_ar: loc?.name_ar as string ?? "",
      locality_name_en: loc?.name_en as string ?? "",
    } satisfies ApplicationItem;
  });
}

export async function getTopReviews(limit = 6): Promise<ReviewListing[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (supabase as any)
    .from("reviews")
    .select(
      `id, rating, body_ar, body_he, body_en, created_at,
       profiles!customer_id(full_name),
       businesses(name_ar, name_he, name_en, slug)`
    )
    .eq("status", "published")
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch reviews:", error.message);
    return [];
  }

  return ((rawData ?? []) as Record<string, unknown>[]).map((r) => {
    const profile = Array.isArray(r.profiles)
      ? (r.profiles[0] as Record<string, unknown>)
      : (r.profiles as Record<string, unknown>);
    const biz = Array.isArray(r.businesses)
      ? (r.businesses[0] as Record<string, unknown>)
      : (r.businesses as Record<string, unknown>);

    return {
      id: r.id as string,
      rating: r.rating as number,
      body_ar: r.body_ar as string | null,
      body_he: r.body_he as string | null,
      body_en: r.body_en as string | null,
      customer_name: profile?.full_name as string | null,
      business_name_ar: biz?.name_ar as string | null,
      business_name_he: biz?.name_he as string | null,
      business_name_en: biz?.name_en as string,
      business_slug: biz?.slug as string,
      created_at: r.created_at as string,
    } satisfies ReviewListing;
  });
}

export interface AvailabilitySlot {
  staff_id: string;
  start_at: string;
  end_at: string;
}

export async function getAvailableSlots(params: {
  businessId: string;
  serviceIds: string[];
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  staffId?: string | null;
}): Promise<AvailabilitySlot[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("get_available_slots", {
    p_business_id: params.businessId,
    p_service_ids: params.serviceIds,
    p_from_date: params.fromDate,
    p_to_date: params.toDate,
    p_staff_id: params.staffId ?? null,
  });

  if (error) {
    console.error("Failed to fetch availability slots:", error.message);
    return [];
  }

  return (data ?? []) as AvailabilitySlot[];
}

// --- Dashboard: Services & Staff ---

export interface DashboardService extends Service {
  is_active: boolean;
  sort_order: number;
  staff_ids: string[];
}

export interface StaffHourRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BlockedSlotRow {
  id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export interface DashboardStaff extends StaffMember {
  is_active: boolean;
  is_visible_in_booking: boolean;
  sort_order: number;
  hours: StaffHourRow[];
  blocked_slots: BlockedSlotRow[];
}

/**
 * Load services for dashboard (business owner/staff). Includes staff_services for assignment.
 */
export async function getServicesForDashboard(businessId: string): Promise<DashboardService[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: servicesData, error: svcError } = await sb
    .from("services")
    .select("id, name_ar, name_he, name_en, description_ar, description_he, description_en, duration_minutes, price, deposit_required, deposit_amount, is_active, sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (svcError || !servicesData?.length) {
    return [];
  }

  const { data: linksData } = await sb
    .from("staff_services")
    .select("service_id, staff_id")
    .in("service_id", (servicesData as { id: string }[]).map((s) => s.id));

  const staffIdsByService: Record<string, string[]> = {};
  for (const s of servicesData as { id: string }[]) {
    staffIdsByService[s.id] = [];
  }
  for (const row of (linksData ?? []) as { service_id: string; staff_id: string }[]) {
    if (!staffIdsByService[row.service_id]) staffIdsByService[row.service_id] = [];
    staffIdsByService[row.service_id].push(row.staff_id);
  }

  return (servicesData as Record<string, unknown>[]).map((s) => ({
    id: s.id as string,
    name_ar: s.name_ar as string | null,
    name_he: s.name_he as string | null,
    name_en: s.name_en as string,
    description_ar: s.description_ar as string | null,
    description_he: s.description_he as string | null,
    description_en: s.description_en as string | null,
    duration_minutes: s.duration_minutes as number,
    price: s.price as number,
    deposit_required: s.deposit_required as boolean,
    deposit_amount: s.deposit_amount as number | null,
    is_active: s.is_active as boolean,
    sort_order: s.sort_order as number,
    staff_ids: staffIdsByService[s.id as string] ?? [],
  }));
}

/**
 * Load staff for dashboard with hours and blocked_slots.
 */
export async function getStaffForDashboard(businessId: string): Promise<DashboardStaff[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: staffData, error: staffError } = await sb
    .from("staff_members")
    .select("id, name_ar, name_he, name_en, role_title_ar, role_title_he, role_title_en, photo_url, is_active, is_visible_in_booking, sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (staffError || !staffData?.length) {
    return [];
  }

  const staffIds = (staffData as { id: string }[]).map((s) => s.id);

  const [{ data: hoursData }, { data: slotsData }] = await Promise.all([
    sb.from("staff_hours").select("staff_id, day_of_week, start_time, end_time").in("staff_id", staffIds),
    sb.from("blocked_slots").select("id, staff_id, start_at, end_at, reason").eq("business_id", businessId).in("staff_id", staffIds),
  ]);

  const hoursByStaff: Record<string, StaffHourRow[]> = {};
  const slotsByStaff: Record<string, BlockedSlotRow[]> = {};
  for (const id of staffIds) {
    hoursByStaff[id] = [];
    slotsByStaff[id] = [];
  }
  for (const h of (hoursData ?? []) as { staff_id: string; day_of_week: number; start_time: string; end_time: string }[]) {
    hoursByStaff[h.staff_id] = hoursByStaff[h.staff_id] ?? [];
    hoursByStaff[h.staff_id].push({ day_of_week: h.day_of_week, start_time: h.start_time, end_time: h.end_time });
  }
  for (const b of (slotsData ?? []) as { id: string; staff_id: string | null; start_at: string; end_at: string; reason: string | null }[]) {
    if (b.staff_id) {
      slotsByStaff[b.staff_id] = slotsByStaff[b.staff_id] ?? [];
      slotsByStaff[b.staff_id].push({ id: b.id, start_at: b.start_at, end_at: b.end_at, reason: b.reason });
    }
  }

  return (staffData as Record<string, unknown>[]).map((s) => ({
    id: s.id as string,
    name_ar: s.name_ar as string | null,
    name_he: s.name_he as string | null,
    name_en: s.name_en as string,
    role_title_ar: s.role_title_ar as string | null,
    role_title_he: s.role_title_he as string | null,
    role_title_en: s.role_title_en as string | null,
    photo_url: s.photo_url as string | null,
    is_active: s.is_active as boolean,
    is_visible_in_booking: s.is_visible_in_booking as boolean,
    sort_order: s.sort_order as number,
    hours: hoursByStaff[s.id as string] ?? [],
    blocked_slots: slotsByStaff[s.id as string] ?? [],
  }));
}

/**
 * Resolve dashboard business id, whether current user is owner, and staff_member_id if user is staff.
 */
export async function getDashboardBusinessId(): Promise<{
  businessId: string;
  isOwner: boolean;
  staffMemberId?: string;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: ownerBiz } = await sb.from("businesses").select("id, owner_id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (ownerBiz?.id) {
    return { businessId: ownerBiz.id as string, isOwner: true };
  }

  const { data: membership } = await sb.from("business_members").select("business_id, staff_member_id").eq("user_id", user.id).eq("is_active", true).limit(1).maybeSingle();
  if (membership?.business_id) {
    return {
      businessId: membership.business_id as string,
      isOwner: false,
      staffMemberId: membership.staff_member_id as string | undefined,
    };
  }
  return null;
}

// --- Dashboard: Schedule & Bookings ---

export interface ScheduleAppointment {
  id: string;
  business_id: string;
  staff_id: string | null;
  start_at: string;
  end_at: string;
  status: string;
  total_duration_minutes: number;
  total_price: number;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  customer_id: string | null;
  customer_name: string | null;
  staff_name: string | null;
  service_names: string[];
}

export interface ScheduleBlock {
  id: string;
  staff_id: string | null;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export async function getScheduleData(
  businessId: string,
  fromDate: string,
  toDate: string,
  staffId?: string | null
): Promise<{ appointments: ScheduleAppointment[]; blocks: ScheduleBlock[] }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const dayStart = `${fromDate}T00:00:00.000Z`;
  const dayEnd = `${toDate}T23:59:59.999Z`;

  let aptQuery = sb
    .from("appointments")
    .select(
      `id, business_id, staff_id, start_at, end_at, status, total_duration_minutes, total_price,
       guest_name, guest_email, guest_phone, customer_id,
       profiles!customer_id(full_name),
       staff_members(name_en, name_ar, name_he),
       appointment_services(service_name_snapshot)`
    )
    .eq("business_id", businessId)
    .gte("start_at", dayStart)
    .lte("start_at", dayEnd)
    .order("start_at", { ascending: true });

  if (staffId) aptQuery = aptQuery.eq("staff_id", staffId);

  const { data: aptData } = await aptQuery;

  let blocksQuery = sb
    .from("blocked_slots")
    .select("id, staff_id, start_at, end_at, reason")
    .eq("business_id", businessId)
    .lte("start_at", dayEnd)
    .gte("end_at", dayStart);

  if (staffId) blocksQuery = blocksQuery.eq("staff_id", staffId);
  const { data: blocksData } = await blocksQuery;

  const appointments: ScheduleAppointment[] = ((aptData ?? []) as Record<string, unknown>[]).map((a) => {
    const profile = Array.isArray(a.profiles) ? (a.profiles[0] as Record<string, unknown>) : (a.profiles as Record<string, unknown>);
    const staffRow = Array.isArray(a.staff_members) ? (a.staff_members[0] as Record<string, unknown>) : (a.staff_members as Record<string, unknown>);
    const services = (a.appointment_services as Record<string, unknown>[]) ?? [];
    return {
      id: a.id as string,
      business_id: a.business_id as string,
      staff_id: a.staff_id as string | null,
      start_at: a.start_at as string,
      end_at: a.end_at as string,
      status: a.status as string,
      total_duration_minutes: a.total_duration_minutes as number,
      total_price: a.total_price as number,
      guest_name: a.guest_name as string | null,
      guest_email: a.guest_email as string | null,
      guest_phone: a.guest_phone as string | null,
      customer_id: a.customer_id as string | null,
      customer_name: (profile?.full_name as string) ?? (a.guest_name as string) ?? null,
      staff_name: staffRow ? ((staffRow.name_en as string) || (staffRow.name_ar as string) || (staffRow.name_he as string)) : null,
      service_names: services.map((s) => s.service_name_snapshot as string),
    };
  });

  const blocks: ScheduleBlock[] = (blocksData ?? []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    staff_id: b.staff_id as string | null,
    start_at: b.start_at as string,
    end_at: b.end_at as string,
    reason: b.reason as string | null,
  }));

  return { appointments, blocks };
}

export interface BookingListItem {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  total_price: number;
  customer_name: string | null;
  guest_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  service_names: string[];
}

export async function getBookingsList(
  businessId: string,
  filters: { from?: string; to?: string; status?: string; staff_id?: string; service_id?: string }
): Promise<BookingListItem[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  let q = sb
    .from("appointments")
    .select(
      `id, start_at, end_at, status, total_price, guest_name,
       customer_id, profiles!customer_id(full_name),
       staff_id, staff_members(name_en, name_ar, name_he),
       appointment_services(service_id, service_name_snapshot)`
    )
    .eq("business_id", businessId)
    .order("start_at", { ascending: false })
    .limit(200);

  if (filters.from) q = q.gte("start_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) q = q.lte("start_at", `${filters.to}T23:59:59.999Z`);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.staff_id) q = q.eq("staff_id", filters.staff_id);

  const { data: rows } = await q;

  let list: BookingListItem[] = ((rows ?? []) as Record<string, unknown>[]).map((r) => {
    const profile = Array.isArray(r.profiles) ? (r.profiles[0] as Record<string, unknown>) : (r.profiles as Record<string, unknown>);
    const staffRow = Array.isArray(r.staff_members) ? (r.staff_members[0] as Record<string, unknown>) : (r.staff_members as Record<string, unknown>);
    const services = (r.appointment_services as Record<string, unknown>[]) ?? [];
    return {
      id: r.id as string,
      start_at: r.start_at as string,
      end_at: r.end_at as string,
      status: r.status as string,
      total_price: r.total_price as number,
      customer_name: profile?.full_name as string | null,
      guest_name: r.guest_name as string | null,
      staff_id: r.staff_id as string | null,
      staff_name: staffRow ? ((staffRow.name_en as string) || (staffRow.name_ar as string) || (staffRow.name_he as string)) : null,
      service_names: services.map((s) => s.service_name_snapshot as string),
    };
  });

  if (filters.service_id) {
    const { data: aptIds } = await sb.from("appointment_services").select("appointment_id").eq("service_id", filters.service_id);
    const ids = new Set((aptIds ?? []).map((x: { appointment_id: string }) => x.appointment_id));
    list = list.filter((b) => ids.has(b.id));
  }

  return list;
}

// --- Dashboard: Offers ---
export interface DashboardOffer {
  id: string;
  title_ar: string | null;
  title_he: string | null;
  title_en: string;
  description_ar: string | null;
  description_he: string | null;
  description_en: string | null;
  discount_type: string;
  discount_value: number;
  start_at: string;
  end_at: string;
  status: string;
  is_visible: boolean;
}

export async function getOffersForDashboard(businessId: string): Promise<DashboardOffer[]> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data } = await sb.from("offers").select("id, title_ar, title_he, title_en, description_ar, description_he, description_en, discount_type, discount_value, start_at, end_at, status, is_visible").eq("business_id", businessId).order("end_at", { ascending: false });
  return (data ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    title_ar: o.title_ar as string | null,
    title_he: o.title_he as string | null,
    title_en: o.title_en as string,
    description_ar: o.description_ar as string | null,
    description_he: o.description_he as string | null,
    description_en: o.description_en as string | null,
    discount_type: o.discount_type as string,
    discount_value: Number(o.discount_value),
    start_at: o.start_at as string,
    end_at: o.end_at as string,
    status: o.status as string,
    is_visible: o.is_visible as boolean,
  }));
}

// --- Dashboard: Reviews ---
export interface DashboardReview {
  id: string;
  rating: number;
  body_ar: string | null;
  body_he: string | null;
  body_en: string | null;
  status: string;
  created_at: string;
  customer_name: string | null;
  response_body: string | null;
}

export async function getReviewsForDashboard(businessId: string): Promise<DashboardReview[]> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data: rows } = await sb.from("reviews").select("id, rating, body_ar, body_he, body_en, status, created_at, profiles!customer_id(full_name), review_responses(body_en)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(100);
  return (rows ?? []).map((r: Record<string, unknown>) => {
    const profile = Array.isArray(r.profiles) ? (r.profiles[0] as Record<string, unknown>) : (r.profiles as Record<string, unknown>);
    const resp = Array.isArray(r.review_responses) ? (r.review_responses[0] as Record<string, unknown>) : (r.review_responses as Record<string, unknown>);
    return {
      id: r.id as string,
      rating: r.rating as number,
      body_ar: r.body_ar as string | null,
      body_he: r.body_he as string | null,
      body_en: r.body_en as string | null,
      status: r.status as string,
      created_at: r.created_at as string,
      customer_name: profile?.full_name as string | null,
      response_body: resp?.body_en as string | null,
    };
  });
}

// --- Dashboard: Analytics ---
export async function getDashboardAnalytics(businessId: string, from: string, to: string): Promise<{ bookings_count: number; revenue: number; new_customers: number; cancellation_count: number }> {
  const supabase = await createClient();
  const sb = supabase as any;
  const dayStart = `${from}T00:00:00.000Z`;
  const dayEnd = `${to}T23:59:59.999Z`;
  const { data: apts } = await sb.from("appointments").select("id, total_price, status, customer_id, created_at").eq("business_id", businessId).gte("start_at", dayStart).lte("start_at", dayEnd);
  const list = (apts ?? []) as { id: string; total_price: number; status: string; customer_id: string | null; created_at: string }[];
  const bookings_count = list.filter((a) => a.status !== "cancelled").length;
  const revenue = list.filter((a) => a.status === "completed" || a.status === "confirmed" || a.status === "checked_in" || a.status === "in_progress").reduce((s, a) => s + Number(a.total_price), 0);
  const cancellation_count = list.filter((a) => a.status === "cancelled").length;
  const firstBookingCustomerIds = new Set<string>();
  for (const a of list) {
    if (!a.customer_id) continue;
    const { count } = await sb.from("appointments").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("customer_id", a.customer_id).lt("created_at", a.created_at);
    if ((count ?? 0) === 0) firstBookingCustomerIds.add(a.customer_id);
  }
  return { bookings_count, revenue, new_customers: firstBookingCustomerIds.size, cancellation_count };
}

// --- Dashboard: Subscription ---
export interface DashboardSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  usage_staff: number;
  usage_offers: number;
  usage_reminders_this_month: number;
}

export async function getSubscriptionForDashboard(businessId: string): Promise<DashboardSubscription | null> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data: sub } = await sb.from("business_subscriptions").select("id, plan_id, status, current_period_start, current_period_end, trial_ends_at, subscription_plans(name_en, name_ar, name_he)").eq("business_id", businessId).in("status", ["trialing", "active", "grace_period", "past_due"]).order("current_period_end", { ascending: false }).limit(1).maybeSingle();
  if (!sub) return null;
  const plan = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
  const { count: staffCount } = await sb.from("staff_members").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_active", true);
  const { count: offersCount } = await sb.from("offers").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "active");
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data: aptIds } = await sb.from("appointments").select("id").eq("business_id", businessId);
  const ids = (aptIds ?? []).map((a: { id: string }) => a.id);
  const { count: reminderCount } = ids.length > 0
    ? await sb.from("reminder_sent").select("id", { count: "exact", head: true }).in("appointment_id", ids).gte("sent_at", monthStart.toISOString())
    : { count: 0 };
  const usage_reminders_this_month = reminderCount ?? 0;
  return {
    id: sub.id,
    plan_id: sub.plan_id,
    plan_name: (plan?.name_en ?? plan?.name_ar ?? plan?.name_he) ?? "Plan",
    status: sub.status,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
    trial_ends_at: sub.trial_ends_at ?? null,
    usage_staff: staffCount ?? 0,
    usage_offers: offersCount ?? 0,
    usage_reminders_this_month,
  };
}

export async function getBillingHistory(businessId: string, limit = 50): Promise<{ id: string; amount: number; currency: string; status: string; paid_at: string | null; created_at: string }[]> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data } = await sb.from("payments").select("id, amount, currency, status, paid_at, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    amount: Number(p.amount),
    currency: (p.currency as string) ?? "ILS",
    status: p.status as string,
    paid_at: p.paid_at as string | null,
    created_at: p.created_at as string,
  }));
}

export async function getBusinessSettings(businessId: string): Promise<{ email_on_booking: boolean; sms_on_reminder: boolean }> {
  const supabase = await createClient();
  const sb = supabase as any;
  const { data } = await sb.from("business_settings").select("email_on_booking, sms_on_reminder").eq("business_id", businessId).maybeSingle();
  return data ? { email_on_booking: !!data.email_on_booking, sms_on_reminder: !!data.sms_on_reminder } : { email_on_booking: true, sms_on_reminder: true };
}

export async function updateBusinessSettings(businessId: string, prefs: { email_on_booking?: boolean; sms_on_reminder?: boolean }): Promise<void> {
  const supabase = await createClient();
  const sb = supabase as any;
  const payload: Record<string, unknown> = { business_id: businessId, updated_at: new Date().toISOString() };
  if (prefs.email_on_booking !== undefined) payload.email_on_booking = prefs.email_on_booking;
  if (prefs.sms_on_reminder !== undefined) payload.sms_on_reminder = prefs.sms_on_reminder;
  await sb.from("business_settings").upsert(payload, { onConflict: "business_id" });
}
