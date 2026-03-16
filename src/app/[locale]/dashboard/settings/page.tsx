import { redirect } from "next/navigation";
import { getDashboardBusinessId } from "@/lib/supabase/queries";
import { DashboardSettingsPage } from "@/components/dashboard/DashboardSettingsPage";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardSettingsRoute({ params }: Props) {
  const { locale } = await params;
  const ctx = await getDashboardBusinessId();
  if (!ctx) redirect(`/${locale}/dashboard`);
  return <DashboardSettingsPage locale={locale} isOwner={ctx.isOwner} />;
}
