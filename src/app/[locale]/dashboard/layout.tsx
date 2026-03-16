import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getMyBusinessForDashboard } from "@/lib/supabase/queries";
import type { UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

function redirectForRole(role: UserRole | null, locale: string) {
  if (role === "business_owner" || role === "staff") return null;
  if (role === "super_admin") return `/${locale}/admin`;
  return `/${locale}`;
}

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;

  // Skip auth check if using placeholder Supabase URL (development)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/${locale}/login?returnUrl=/${locale}/dashboard`);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile as { role?: UserRole } | null)?.role ?? null;
    const to = redirectForRole(role, locale);
    if (to) redirect(to);
  }

  const business = await getMyBusinessForDashboard();
  const businessName =
    business &&
    (locale === "ar"
      ? business.name_ar ?? business.name_en
      : locale === "he"
        ? business.name_he ?? business.name_en
        : business.name_en);

  return (
    <DashboardShell locale={locale} businessName={businessName}>
      {children}
    </DashboardShell>
  );
}
