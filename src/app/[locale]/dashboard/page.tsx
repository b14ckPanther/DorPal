import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  return <DashboardOverview locale={locale} />;
}
