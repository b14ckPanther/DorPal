import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingWizard } from "@/components/business/BookingWizard";
import { getBusinessBySlug } from "@/lib/supabase/queries";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function BusinessBookPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { service } = await searchParams;

  const business = await getBusinessBySlug(slug);
  const t = await getTranslations("booking");

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {business ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold text-dp-text-primary mb-1">
                  {locale === "ar"
                    ? business.name_ar ?? business.name_en
                    : locale === "he"
                    ? business.name_he ?? business.name_en
                    : business.name_en}
                </h1>
                <p className="text-sm text-dp-text-muted mb-4">
                  {t("hero_subtitle")}
                </p>

                <BookingWizard
                  locale={locale}
                  business={business}
                  initialServiceId={service}
                />
              </div>
              <aside className="space-y-3">
                <div className="bg-dp-surface border border-dp-border rounded-card p-4 text-sm text-dp-text-secondary">
                  <p className="font-semibold text-dp-text-primary mb-1">
                    {t("what_next_title")}
                  </p>
                  <ul className="list-disc ms-4 space-y-1">
                    <li>{t("what_next_step1")}</li>
                    <li>{t("what_next_step2")}</li>
                    <li>{t("what_next_step3")}</li>
                  </ul>
                </div>
              </aside>
            </div>
          ) : (
            <p className="text-center text-dp-text-muted py-16 text-sm">
              Business not found.
            </p>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

