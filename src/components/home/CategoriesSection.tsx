import Link from "next/link";
import {
  Scissors,
  Gem,
  Leaf,
  Eye,
  Palette,
  Wind,
  Smile,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCategories } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface CategoriesSectionProps {
  locale: string;
}

const CATEGORY_ICON_MAP: Record<string, { Icon: LucideIcon; bg: string; gradient: string }> = {
  "mens-barber": { Icon: Scissors, bg: "bg-brand-plum/10", gradient: "from-[#5B2A86] to-[#7C5CFF]" },
  "womens-beauty": { Icon: Gem, bg: "bg-brand-iris/10", gradient: "from-[#7C5CFF] to-[#C084FC]" },
  "nail-care": { Icon: Gem, bg: "bg-purple-100", gradient: "from-[#C084FC] to-[#F472B6]" },
  "spa-massage": { Icon: Leaf, bg: "bg-emerald-50", gradient: "from-[#059669] to-[#10B981]" },
  "skin-care": { Icon: Smile, bg: "bg-sky-50", gradient: "from-[#0EA5E9] to-[#22C7F2]" },
  "lashes-brows": { Icon: Eye, bg: "bg-amber-50", gradient: "from-[#D97706] to-[#F59E0B]" },
  makeup: { Icon: Palette, bg: "bg-pink-50", gradient: "from-[#EC4899] to-[#F43F5E]" },
  "hair-care": { Icon: Wind, bg: "bg-brand-iris/10", gradient: "from-[#7C5CFF] to-[#22C7F2]" },
};

const FALLBACK_ICON = { Icon: Scissors, bg: "bg-dp-surface-alt", gradient: "from-brand-iris to-brand-plum" };

export async function CategoriesSection({ locale }: CategoriesSectionProps) {
  const [t, categories] = await Promise.all([getTranslations(), getCategories()]);

  if (categories.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-dp-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-plum mb-2">
            {t("home.categories.title")}
          </h2>
          <p className="text-dp-text-secondary">
            {t("home.categories.subtitle")}
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const name =
              locale === "ar" ? cat.name_ar : locale === "he" ? cat.name_he : cat.name_en;
            const { Icon, bg, gradient } =
              CATEGORY_ICON_MAP[cat.slug] ?? FALLBACK_ICON;

            return (
              <Link
                key={cat.id}
                href={`/${locale}/search?category=${cat.id}`}
                className="group relative bg-dp-surface border border-dp-border rounded-card p-4 sm:p-5 flex flex-col items-center gap-3 hover:border-brand-iris/40 hover:shadow-card transition-all duration-200 text-center"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center",
                    "group-hover:scale-110 transition-transform duration-200",
                    bg
                  )}
                >
                  <Icon className="h-6 w-6 text-dp-text-secondary group-hover:text-brand-iris transition-colors" />
                </div>

                {/* Name */}
                <p className="font-semibold text-sm text-dp-text-primary group-hover:text-brand-iris transition-colors">
                  {name}
                </p>

                {/* Gradient bar on hover */}
                <div
                  className={cn(
                    "absolute bottom-0 start-0 end-0 h-0.5 rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                    gradient
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
