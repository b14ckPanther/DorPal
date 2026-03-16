import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowRight, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getActiveBusinesses } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FeaturedBusinessesProps {
  locale: string;
}

export async function FeaturedBusinesses({ locale }: FeaturedBusinessesProps) {
  const [t, businesses] = await Promise.all([getTranslations(), getActiveBusinesses(6)]);
  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  if (businesses.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-dp-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-plum mb-1">
              {t("home.featured.title")}
            </h2>
            <p className="text-dp-text-secondary">{t("home.featured.subtitle")}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" asChild>
            <Link href={`/${locale}/search`}>
              {t("common.see_all")}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {businesses.map((biz, i) => {
            const name =
              locale === "ar"
                ? (biz.name_ar ?? biz.name_en)
                : locale === "he"
                  ? (biz.name_he ?? biz.name_en)
                  : biz.name_en;
            const categoryName =
              locale === "ar"
                ? biz.category.name_ar
                : locale === "he"
                  ? biz.category.name_he
                  : biz.category.name_en;
            const localityName =
              locale === "ar"
                ? biz.locality.name_ar
                : locale === "he"
                  ? biz.locality.name_he
                  : biz.locality.name_en;

            return (
              <article
                key={biz.id}
                className={cn(
                  "group relative bg-dp-surface rounded-card border border-dp-border overflow-hidden",
                  "shadow-card hover:shadow-overlay transition-all duration-300 hover:-translate-y-1",
                  i === 0 && "sm:col-span-2 lg:col-span-1"
                )}
              >
                {/* Cover */}
                <div className="relative h-44 overflow-hidden bg-dp-surface-alt">
                  {biz.cover_url ? (
                    <Image
                      src={biz.cover_url}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-plum" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Logo */}
                  <div className="absolute bottom-3 start-3">
                    <div className="h-12 w-12 rounded-xl border-2 border-white/80 overflow-hidden shadow-modal bg-dp-surface flex items-center justify-center">
                      {biz.logo_url ? (
                        <Image
                          src={biz.logo_url}
                          alt={name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-plum flex items-center justify-center text-white font-bold text-lg">
                          {name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-dp-text-primary text-base leading-tight group-hover:text-brand-iris transition-colors truncate">
                        <Link
                          href={`/${locale}/business/${biz.slug}`}
                          className="after:absolute after:inset-0"
                        >
                          {name}
                        </Link>
                      </h3>
                      <p className="text-xs text-dp-text-muted mt-0.5">{categoryName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-dp-surface-alt rounded-lg px-2 py-1">
                      <Star className="h-3.5 w-3.5 star-filled" />
                      <span className="text-sm font-bold text-dp-text-primary num">
                        {biz.rating_avg > 0 ? biz.rating_avg.toFixed(1) : "-"}
                      </span>
                      {biz.rating_count > 0 && (
                        <span className="text-xs text-dp-text-muted">
                          ({biz.rating_count})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 text-xs text-dp-text-muted mb-3">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-iris" />
                    {localityName}
                  </div>

                  {/* Services */}
                  {biz.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {biz.services.map((s, idx) => {
                        const sName =
                          locale === "ar"
                            ? (s.name_ar ?? s.name_en)
                            : locale === "he"
                              ? (s.name_he ?? s.name_en)
                              : s.name_en;
                        return (
                          <span
                            key={idx}
                            className="text-xs bg-dp-surface-alt text-dp-text-secondary px-2 py-0.5 rounded-full"
                          >
                            {sName}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-dp-border">
                    {biz.services.length > 0 && (
                      <div className="text-sm">
                        <span className="text-dp-text-muted text-xs">
                          {t("common.price")}:{" "}
                        </span>
                        <span className="font-bold text-dp-text-primary num">
                          {t("common.currency")}
                          {Math.min(...biz.services.map((s) => s.price))}+
                        </span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="relative z-10 pointer-events-auto ms-auto"
                      asChild
                    >
                      <Link href={`/${locale}/business/${biz.slug}`}>
                        {t("business.book")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
