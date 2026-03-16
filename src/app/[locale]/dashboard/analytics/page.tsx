import { redirect } from "next/navigation";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { DashboardAnalyticsPage } from "@/components/dashboard/DashboardAnalyticsPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardAnalyticsRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  return <DashboardAnalyticsPage locale={locale} />;
}
