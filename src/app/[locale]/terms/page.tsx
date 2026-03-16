import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <h1 className="text-2xl font-semibold">{t("legal.terms.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("legal.terms.intro")}
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.terms.use_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.use_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.terms.bookings_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.bookings_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.terms.liability_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.liability_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.terms.changes_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.changes_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.terms.law_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.terms.law_body")}
            </p>
          </section>

          <p className="text-xs text-muted-foreground">
            {t("legal.terms.last_updated")}
          </p>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

