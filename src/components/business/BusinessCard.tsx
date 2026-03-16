import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Clock, Star, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BusinessWithDetails } from "@/types/database";

interface BusinessCardProps {
  business: BusinessWithDetails;
  locale: string;
  variant?: "default" | "compact" | "featured";
}

export function BusinessCard({
  business,
  locale,
  variant = "default",
}: BusinessCardProps) {
  const t = useTranslations();
  const localityName =
    locale === "ar"
      ? business.locality.name_ar
      : locale === "he"
        ? business.locality.name_he
        : business.locality.name_en;

  const categoryName =
    locale === "ar"
      ? business.category.name_ar
      : locale === "he"
        ? business.category.name_he
        : business.category.name_en;

  const hasOffer =
    business.offers && business.offers.filter((o) => o.status === "active").length > 0;

  const isFeatured = business.placement === "featured";

  if (variant === "compact") {
    return (
      <Link
        href={`/${locale}/business/${business.slug}`}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-card border border-dp-border bg-dp-surface",
          "hover:shadow-card hover:border-brand-iris/30 transition-all duration-200"
        )}
      >
        <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-dp-surface-alt">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              fill
              className="object-cover"
            />
          ) : (
            <BusinessPlaceholder name={business.name} size="sm" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-dp-text-primary text-sm truncate">
            {business.name}
          </p>
          <p className="text-xs text-dp-text-muted truncate">{categoryName}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Star className="h-3.5 w-3.5 star-filled" />
          <span className="text-sm font-medium text-dp-text-primary num">
            {business.rating_avg.toFixed(1)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "group relative bg-dp-surface rounded-card border border-dp-border overflow-hidden",
        "shadow-card hover:shadow-overlay transition-all duration-300",
        "hover:-translate-y-1",
        isFeatured && "border-brand-iris/40 ring-1 ring-brand-iris/20"
      )}
    >
      {/* Cover image */}
      <div className="relative h-44 sm:h-48 overflow-hidden bg-dp-surface-alt">
        {business.cover_url ? (
          <Image
            src={business.cover_url}
            alt={business.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <BusinessCoverPlaceholder category={categoryName} />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
          {isFeatured && (
            <Badge variant="featured" size="sm" className="gap-1">
              <Star className="h-3 w-3" />
              {t("business.featured")}
            </Badge>
          )}
          {hasOffer && (
            <Badge variant="warning" size="sm" className="gap-1 offer-pulse">
              <Tag className="h-3 w-3" />
              {t("business.offer_badge")}
            </Badge>
          )}
        </div>

        {/* Logo overlay */}
        <div className="absolute bottom-3 start-3">
          <div className="h-12 w-12 rounded-xl border-2 border-white/80 overflow-hidden shadow-modal bg-dp-surface">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <BusinessPlaceholder name={business.name} size="md" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dp-text-primary text-base leading-tight truncate group-hover:text-brand-iris transition-colors">
              <Link
                href={`/${locale}/business/${business.slug}`}
                className="after:absolute after:inset-0"
              >
                {business.name}
              </Link>
            </h3>
            <p className="text-sm text-dp-text-muted mt-0.5">{categoryName}</p>
          </div>
          {/* Rating */}
          <div className="flex items-center gap-1 shrink-0 bg-dp-surface-alt rounded-lg px-2 py-1">
            <Star className="h-3.5 w-3.5 star-filled" />
            <span className="text-sm font-semibold text-dp-text-primary num">
              {business.rating_avg.toFixed(1)}
            </span>
            <span className="text-xs text-dp-text-muted">
              ({business.rating_count})
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-dp-text-muted mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{localityName}</span>
          </span>
          {business.services && business.services.length > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {business.services[0]?.duration_minutes} {t("common.minutes")}
              </span>
            </span>
          )}
        </div>

        {/* Services preview */}
        {business.services && business.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {business.services.slice(0, 3).map((service) => (
              <span
                key={service.id}
                className="text-xs bg-dp-surface-alt text-dp-text-secondary px-2 py-0.5 rounded-full"
              >
                {service.name}
              </span>
            ))}
            {business.services.length > 3 && (
              <span className="text-xs text-brand-iris px-2 py-0.5">
                +{business.services.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price range + CTA */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-dp-border">
          {business.services && business.services.length > 0 && (
            <div className="text-sm">
              <span className="text-dp-text-muted">{t("common.price")}: </span>
              <span className="font-semibold text-dp-text-primary num">
                {t("common.currency")}
                {Math.min(...business.services.map((s) => s.price_ils))}+
              </span>
            </div>
          )}
          <Button size="sm" className="shrink-0 relative z-10 pointer-events-auto">
            <Link
              href={`/${locale}/business/${business.slug}`}
              onClick={(e) => e.stopPropagation()}
            >
              {t("business.book")}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function BusinessPlaceholder({
  name,
  size,
}: {
  name: string;
  size: "sm" | "md" | "lg";
}) {
  const initial = name?.[0]?.toUpperCase() ?? "B";
  const colors = [
    "from-brand-plum to-brand-iris",
    "from-brand-iris to-brand-cyan",
    "from-brand-plum to-brand-cyan",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center font-bold text-white",
        `bg-gradient-to-br ${colors[colorIndex]}`,
        sizes[size]
      )}
    >
      {initial}
    </div>
  );
}

function BusinessCoverPlaceholder({ category }: { category: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dp-surface-alt to-dp-border">
      <CategoryIcon category={category} />
      <span className="text-xs text-dp-text-muted mt-2">{category}</span>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="text-dp-text-muted"
    >
      <rect
        x="8"
        y="8"
        width="24"
        height="24"
        rx="12"
        fill="currentColor"
        opacity="0.1"
      />
      <path
        d="M20 13c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2s2-.9 2-2V15c0-1.1-.9-2-2-2z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}
