import { AdminUsersPage } from "@/components/admin/AdminUsersPage";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminUsersRoute({ params }: Props) {
  const { locale } = await params;
  return <AdminUsersPage locale={locale} />;
}
