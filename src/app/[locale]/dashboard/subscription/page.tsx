import { redirect } from "next/navigation";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { DashboardSubscriptionPage } from "@/components/dashboard/DashboardSubscriptionPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardSubscriptionRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  return <DashboardSubscriptionPage locale={locale} />;
}
