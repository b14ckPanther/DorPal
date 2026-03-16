import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BusinessProfilePage } from "@/components/business/BusinessProfilePage";
import { getBusinessBySlug } from "@/lib/supabase/queries";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BusinessPage({ params }: Props) {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <BusinessProfilePage locale={locale} slug={slug} business={business} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
