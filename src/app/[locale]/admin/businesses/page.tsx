import { AdminBusinessesPage } from "@/components/admin/AdminBusinessesPage";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminBusinessesRoute({ params }: Props) {
  const { locale } = await params;
  return <AdminBusinessesPage locale={locale} />;
}
