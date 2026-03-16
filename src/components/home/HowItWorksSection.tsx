import { Search, CalendarCheck, Smile } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

interface HowItWorksSectionProps {
  locale: string;
}

const STEPS = [
  {
    icon: Search,
    number: "01",
    key: "step1",
    color: "text-brand-iris",
    bg: "bg-brand-iris/10",
    border: "border-brand-iris/20",
  },
  {
    icon: CalendarCheck,
    number: "02",
    key: "step2",
    color: "text-brand-plum",
    bg: "bg-brand-plum/10",
    border: "border-brand-plum/20",
  },
  {
    icon: Smile,
    number: "03",
    key: "step3",
    color: "text-brand-cyan",
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/20",
  },
];

export async function HowItWorksSection({ locale }: HowItWorksSectionProps) {
  const t = await getTranslations();
  return (
    <section className="py-16 sm:py-20 bg-dp-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-plum mb-2">
            {t("home.how_it_works.title")}
          </h2>
          <div className="w-16 h-1 bg-gradient-iris rounded-full mx-auto" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 start-[calc(16.67%+2rem)] end-[calc(16.67%+2rem)] h-0.5 bg-dp-border" />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.key}
                className="relative flex flex-col items-center text-center"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {/* Step circle */}
                <div className="relative mb-6">
                  <div
                    className={cn(
                      "h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 flex items-center justify-center",
                      "bg-dp-surface shadow-card",
                      step.border
                    )}
                  >
                    <div
                      className={cn(
                        "h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center",
                        step.bg
                      )}
                    >
                      <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7", step.color)} />
                    </div>
                  </div>
                  {/* Number badge */}
                  <div
                    className={cn(
                      "absolute -top-2 -end-2 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-raised",
                      i === 0
                        ? "bg-brand-iris"
                        : i === 1
                          ? "bg-brand-plum"
                          : "bg-brand-cyan"
                    )}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-dp-text-primary mb-2">
                  {t(`home.how_it_works.${step.key}.title`)}
                </h3>
                <p className="text-dp-text-secondary text-sm leading-relaxed max-w-[240px]">
                  {t(`home.how_it_works.${step.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
