import { Star, Quote } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getTopReviews } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  locale: string;
}

const AVATAR_COLORS = [
  "bg-brand-iris",
  "bg-brand-plum",
  "bg-brand-cyan",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export async function TestimonialsSection({ locale }: TestimonialsSectionProps) {
  const [t, reviews] = await Promise.all([getTranslations(), getTopReviews(6)]);

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-dp-surface-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-plum mb-2">
            {t("home.testimonials.title")}
          </h2>
        </div>

        {/* Reviews grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {reviews.map((review, i) => {
            const text =
              locale === "ar"
                ? (review.body_ar ?? review.body_en)
                : locale === "he"
                  ? (review.body_he ?? review.body_en)
                  : review.body_en;
            const bizName =
              locale === "ar"
                ? (review.business_name_ar ?? review.business_name_en)
                : locale === "he"
                  ? (review.business_name_he ?? review.business_name_en)
                  : review.business_name_en;
            const initial = review.customer_name?.[0]?.toUpperCase() ?? "?";
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

            if (!text) return null;

            return (
              <div
                key={review.id}
                className="bg-dp-surface rounded-card border border-dp-border p-5 sm:p-6 shadow-card"
              >
                {/* Quote icon + stars */}
                <div className="flex justify-between items-start mb-4">
                  <Quote className="h-8 w-8 text-brand-iris/20 shrink-0" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }, (_, idx) => (
                      <Star key={idx} className="h-4 w-4 star-filled" />
                    ))}
                  </div>
                </div>

                {/* Review text */}
                <p className="text-dp-text-secondary text-sm leading-relaxed mb-5">
                  {text}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
                      color
                    )}
                  >
                    {initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-dp-text-primary">
                      {review.customer_name ?? t("common.anonymous")}
                    </p>
                    {bizName && (
                      <p className="text-xs text-dp-text-muted">{bizName}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
