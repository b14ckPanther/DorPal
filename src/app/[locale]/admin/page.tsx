import { AdminApplicationsPage } from "@/components/admin/AdminApplicationsPage";
import { getApplications } from "@/lib/supabase/queries";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  const applications = await getApplications();
  return <AdminApplicationsPage locale={locale} applications={applications} />;
}
