import { redirect } from "next/navigation";
import {
  getDashboardBusinessId,
  getServicesForDashboard,
  getStaffForDashboard,
} from "@/lib/supabase/queries";
import { DashboardServicesPage } from "@/components/dashboard/DashboardServicesPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardServicesRoute({ params }: Props) {
  const { locale } = await params;

  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);

  const [services, staff] = await Promise.all([
    getServicesForDashboard(ctx.businessId),
    getStaffForDashboard(ctx.businessId),
  ]);

  return (
    <DashboardServicesPage
      locale={locale}
      initialServices={services}
      staffList={staff}
      isOwner={ctx.isOwner}
    />
  );
}
