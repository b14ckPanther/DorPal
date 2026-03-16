import { AdminReviewsPage } from "@/components/admin/AdminReviewsPage";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminReviewsRoute({ params }: Props) {
  const { locale } = await params;
  return <AdminReviewsPage locale={locale} />;
}
