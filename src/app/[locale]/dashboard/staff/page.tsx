import { redirect } from "next/navigation";
import {
  getDashboardBusinessId,
  getStaffForDashboard,
} from "@/lib/supabase/queries";
import { DashboardStaffPage } from "@/components/dashboard/DashboardStaffPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardStaffRoute({ params }: Props) {
  const { locale } = await params;

  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);

  const staff = await getStaffForDashboard(ctx.businessId);

  return (
    <DashboardStaffPage
      locale={locale}
      initialStaff={staff}
      isOwner={ctx.isOwner}
      staffMemberId={ctx.staffMemberId ?? null}
    />
  );
}
