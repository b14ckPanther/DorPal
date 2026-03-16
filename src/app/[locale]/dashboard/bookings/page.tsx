import { redirect } from "next/navigation";
import {
  getDashboardBusinessId,
  getStaffForDashboard,
  getServicesForDashboard,
  getMyBusinessForDashboard,
} from "@/lib/supabase/queries";
import { DashboardBookingsPage } from "@/components/dashboard/DashboardBookingsPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardBookingsRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  const [business, staff, services] = await Promise.all([
    getMyBusinessForDashboard(),
    getStaffForDashboard(ctx.businessId),
    getServicesForDashboard(ctx.businessId),
  ]);
  if (!business) redirect(`/${locale}/dashboard`);
  return (
    <DashboardBookingsPage
      locale={locale}
      staffList={staff}
      serviceList={services}
      businessSlug={business.slug}
    />
  );
}
