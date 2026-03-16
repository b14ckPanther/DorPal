import { redirect } from "next/navigation";
import { getDashboardBusinessId, getOffersForDashboard } from "@/lib/supabase/queries";
import { DashboardOffersPage } from "@/components/dashboard/DashboardOffersPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardOffersRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  const offers = await getOffersForDashboard(ctx.businessId);
  return <DashboardOffersPage locale={locale} initialOffers={offers} isOwner={ctx.isOwner} />;
}
