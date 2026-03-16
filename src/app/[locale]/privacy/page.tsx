import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <h1 className="text-2xl font-semibold">
            {t("legal.privacy.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("legal.privacy.intro")}
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.information_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.information_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.use_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.use_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.sharing_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.sharing_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.security_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.security_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.rights_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.rights_body")}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("legal.privacy.changes_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("legal.privacy.changes_body")}
            </p>
          </section>

          <p className="text-xs text-muted-foreground">
            {t("legal.privacy.last_updated")}
          </p>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

