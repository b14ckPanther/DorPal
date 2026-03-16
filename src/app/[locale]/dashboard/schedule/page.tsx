import { redirect } from "next/navigation";
import { getDashboardBusinessId, getStaffForDashboard, getMyBusinessForDashboard } from "@/lib/supabase/queries";
import { DashboardSchedulePage } from "@/components/dashboard/DashboardSchedulePage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardScheduleRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  const [business, staff] = await Promise.all([
    getMyBusinessForDashboard(),
    getStaffForDashboard(ctx.businessId),
  ]);
  if (!business) redirect(`/${locale}/dashboard`);
  return (
    <DashboardSchedulePage
      locale={locale}
      staffList={staff}
      businessSlug={business.slug}
    />
  );
}
