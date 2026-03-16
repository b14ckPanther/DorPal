import { redirect } from "next/navigation";
import { getDashboardBusinessId, getReviewsForDashboard } from "@/lib/supabase/queries";
import { DashboardReviewsPage } from "@/components/dashboard/DashboardReviewsPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardReviewsRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  const reviews = await getReviewsForDashboard(ctx.businessId);
  return <DashboardReviewsPage locale={locale} initialReviews={reviews} isOwner={ctx.isOwner} />;
}
