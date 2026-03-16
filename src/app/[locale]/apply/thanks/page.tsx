import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
};

export default async function ApplyThanksPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { email } = await searchParams;
  const t = await getTranslations();

  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-dp-success-bg mb-6">
            <CheckCircle2 className="h-10 w-10 text-dp-success" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-dp-text-primary mb-3">
            {t("apply.success.title")}
          </h1>
          <p className="text-dp-text-muted mb-2">
            {t("apply.success.subtitle")}
          </p>
          {email && (
            <p className="text-sm text-dp-text-secondary mb-8">
              {t("apply.success.message", { email })}
            </p>
          )}

          <div className="bg-dp-surface-alt rounded-card p-4 mb-8 text-start space-y-2">
            {[
              t("apply.process.step1"),
              t("apply.process.step2"),
              t("apply.process.step3"),
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-dp-text-secondary">
                <div className="h-5 w-5 rounded-full bg-brand-iris flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                {step}
              </div>
            ))}
          </div>

          <Button size="lg" className="gap-2" asChild>
            <Link href={`/${locale}`}>
              {t("apply.success.home")}
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
