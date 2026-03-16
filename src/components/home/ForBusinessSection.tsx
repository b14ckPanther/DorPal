import Link from "next/link";
import {
  CalendarCheck,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ForBusinessSectionProps {
  locale: string;
}

const FEATURES = [
  { icon: CalendarCheck, key: "feature1", color: "text-brand-iris" },
  { icon: Users, key: "feature2", color: "text-brand-plum" },
  { icon: BarChart3, key: "feature3", color: "text-brand-cyan" },
];

const TIERS = [
  {
    name: { ar: "أساسي", he: "בסיסי", en: "Essential" },
    price: 49,
    color: "border-dp-border",
    tag: null,
  },
  {
    name: { ar: "نمو", he: "צמיחה", en: "Growth" },
    price: 99,
    color: "border-brand-iris",
    tag: { ar: "الأكثر شيوعاً", he: "הפופולרי ביותר", en: "Most Popular" },
  },
  {
    name: { ar: "مميز", he: "פרמיום", en: "Premium" },
    price: 199,
    color: "border-brand-plum",
    tag: null,
  },
];

export async function ForBusinessSection({ locale }: ForBusinessSectionProps) {
  const t = await getTranslations();
  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  return (
    <section className="py-16 sm:py-20 bg-dp-text-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -start-20 w-80 h-80 rounded-full bg-brand-iris/10 blur-3xl" />
        <div className="absolute -bottom-20 -end-20 w-80 h-80 rounded-full bg-brand-plum/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left / Content */}
          <div className="mb-12 lg:mb-0">
            <div className="inline-flex items-center gap-2 bg-brand-iris/20 border border-brand-iris/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-sm font-medium text-brand-iris">
                {locale === "ar"
                  ? "للأعمال التجارية"
                  : locale === "he"
                    ? "לעסקים"
                    : "For Businesses"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
              {t("home.for_business.title")}
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8">
              {t("home.for_business.subtitle")}
            </p>

            {/* Features list */}
            <ul className="space-y-4 mb-8">
              {FEATURES.map(({ icon: Icon, key, color }) => (
                <li key={key} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-iris/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-brand-iris" />
                  </div>
                  <span className="text-white/80 text-sm sm:text-base">
                    {t(`home.for_business.${key}`)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Trial note */}
            <div className="flex items-center gap-2 text-white/50 text-sm mb-8">
              <Clock className="h-4 w-4" />
              <span>
                {locale === "ar"
                  ? "تجربة مجانية 14 يوم · لا يتطلب بطاقة ائتمان"
                  : locale === "he"
                    ? "14 ימי ניסיון חינם · ללא כרטיס אשראי"
                    : "14-day free trial · No credit card required"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button size="lg" asChild>
                <Link href={`/${locale}/apply`}>
                  {t("home.for_business.cta")}
                  <ArrowIcon className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white/70 hover:text-white hover:bg-white/10"
                asChild
              >
                <Link href={`/${locale}/dashboard`}>
                  {locale === "ar"
                    ? "عرض لوحة التحكم"
                    : locale === "he"
                      ? "הצג לוח ניהול"
                      : "View Dashboard Demo"}
                </Link>
              </Button>
            </div>
          </div>

          {/* Right / Pricing preview */}
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map((tier) => {
              const name =
                locale === "ar"
                  ? tier.name.ar
                  : locale === "he"
                    ? tier.name.he
                    : tier.name.en;
              const tagLabel = tier.tag
                ? locale === "ar"
                  ? tier.tag.ar
                  : locale === "he"
                    ? tier.tag.he
                    : tier.tag.en
                : null;

              return (
                <div
                  key={tier.price}
                  className={cn(
                    "relative bg-white/5 border rounded-card p-4 text-center",
                    tier.color,
                    tier.tag && "bg-white/10"
                  )}
                >
                  {tagLabel && (
                    <div className="absolute -top-3 start-0 end-0 flex justify-center">
                      <span className="bg-brand-iris text-white text-xs font-medium px-3 py-0.5 rounded-full">
                        {tagLabel}
                      </span>
                    </div>
                  )}
                  <p className="text-white/60 text-xs mb-2">{name}</p>
                  <p className="text-white font-bold text-2xl num">
                    ₪{tier.price}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {t("common.per_month")}
                  </p>
                </div>
              );
            })}

            {/* Feature bullets */}
            <div className="col-span-3 bg-white/5 border border-white/10 rounded-card p-4 space-y-2.5">
              {[
                {
                  ar: "جدول المواعيد الذكي",
                  he: "לוח זמנים חכם",
                  en: "Smart scheduling",
                },
                {
                  ar: "إدارة الفريق والخدمات",
                  he: "ניהול צוות ושירותים",
                  en: "Team & service management",
                },
                {
                  ar: "تقارير وإحصائيات",
                  he: "דוחות וסטטיסטיקות",
                  en: "Reports & analytics",
                },
                {
                  ar: "إشعارات تلقائية للعملاء",
                  he: "התראות אוטומטיות ללקוחות",
                  en: "Automatic client notifications",
                },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-brand-iris shrink-0" />
                  <span className="text-white/70">
                    {locale === "ar"
                      ? feature.ar
                      : locale === "he"
                        ? feature.he
                        : feature.en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
