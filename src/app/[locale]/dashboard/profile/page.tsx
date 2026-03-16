import { redirect } from "next/navigation";
import { getCategories, getLocalities, getMyBusinessForDashboard } from "@/lib/supabase/queries";
import { BusinessProfileForm } from "@/components/dashboard/BusinessProfileForm";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardProfilePage({ params }: Props) {
  const { locale } = await params;

  const [business, localities, categories] = await Promise.all([
    getMyBusinessForDashboard(),
    getLocalities(),
    getCategories(),
  ]);

  if (!business) redirect(`/${locale}/dashboard`);

  return (
    <BusinessProfileForm
      locale={locale}
      business={business}
      localities={localities}
      categories={categories}
    />
  );
}

