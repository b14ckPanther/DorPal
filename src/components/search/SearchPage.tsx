"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Scissors,
  ChevronDown,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { Locality, Category, BusinessListing } from "@/lib/supabase/queries";

interface SearchPageProps {
  locale: string;
  initialQuery: string;
  initialLocality: string;
  initialCategory: string;
  initialSort: string;
  initialHasOffers: boolean;
  localities: Locality[];
  categories: Category[];
  businesses: BusinessListing[];
}

export function SearchPage({
  locale,
  initialQuery,
  initialLocality,
  initialCategory,
  initialSort,
  initialHasOffers,
  localities,
  categories,
  businesses,
}: SearchPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [locality, setLocality] = useState(initialLocality);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [hasOffers, setHasOffers] = useState(initialHasOffers);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getName = useCallback(
    (obj: { name_ar: string; name_he: string; name_en: string }) =>
      locale === "ar" ? obj.name_ar : locale === "he" ? obj.name_he : obj.name_en,
    [locale]
  );

  const getBizName = useCallback(
    (biz: BusinessListing) =>
      locale === "ar"
        ? (biz.name_ar ?? biz.name_en)
        : locale === "he"
          ? (biz.name_he ?? biz.name_en)
          : biz.name_en,
    [locale]
  );

  // Filter results
  const results = businesses.filter((b) => {
    const bizName = getBizName(b).toLowerCase();
    const catName = getName(b.category).toLowerCase();
    const matchQuery =
      !query ||
      bizName.includes(query.toLowerCase()) ||
      catName.includes(query.toLowerCase());
    const matchLocality = !locality || b.locality.id === locality;
    const matchCategory = !category || b.category.id === category;
    return matchQuery && matchLocality && matchCategory;
  });

  // Sort
  const sorted = [...results].sort((a, b) => {
    if (sort === "rating") return b.rating_avg - a.rating_avg;
    if (sort === "name") return getBizName(a).localeCompare(getBizName(b));
    return 0;
  });

  const activeFiltersCount = [locality, category, hasOffers].filter(Boolean).length;

  function clearFilters() {
    setLocality("");
    setCategory("");
    setHasOffers(false);
  }

  const selectedLocalityLabel =
    localities.find((l) => l.id === locality) ?? null;
  const selectedCategoryLabel =
    categories.find((c) => c.id === category) ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top search bar */}
      <div className="bg-dp-surface rounded-2xl border border-dp-border shadow-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-dp-text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full h-11 ps-10 pe-4 bg-dp-surface-alt rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-iris/30 transition-all"
            />
          </div>
          <Button
            variant="outline"
            size="md"
            className="gap-2 relative"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("search.filters")}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-brand-iris text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-dp-border grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Locality */}
            <FilterSelect
              label={t("search.locality")}
              value={locality}
              onChange={setLocality}
              options={localities.map((l) => ({
                value: l.id,
                label: getName(l),
              }))}
              placeholder={
                locale === "ar" ? "كل المناطق" : locale === "he" ? "כל האזורים" : "All Areas"
              }
              icon={<MapPin className="h-4 w-4" />}
            />

            {/* Category */}
            <FilterSelect
              label={t("search.category")}
              value={category}
              onChange={setCategory}
              options={categories.map((c) => ({
                value: c.id,
                label: getName(c),
              }))}
              placeholder={
                locale === "ar" ? "كل الفئات" : locale === "he" ? "כל הקטגוריות" : "All Categories"
              }
              icon={<Scissors className="h-4 w-4" />}
            />

            {/* Sort */}
            <div className="space-y-3">
              <FilterSelect
                label={t("search.sort_label")}
                value={sort}
                onChange={setSort}
                options={[
                  { value: "rating", label: t("search.sort_rating") },
                  { value: "newest", label: t("search.sort_newest") },
                  { value: "name", label: t("search.sort_name") },
                ]}
                icon={<ChevronDown className="h-4 w-4" />}
              />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="sm:col-span-3 text-sm text-dp-error hover:underline text-start flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                {t("search.clear_filters")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active filters chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedLocalityLabel && (
            <FilterChip
              label={getName(selectedLocalityLabel)}
              onRemove={() => setLocality("")}
            />
          )}
          {selectedCategoryLabel && (
            <FilterChip
              label={getName(selectedCategoryLabel)}
              onRemove={() => setCategory("")}
            />
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-dp-text-muted mb-6">
        {t("search.results_count", { count: sorted.length })}
      </p>

      {/* Results grid */}
      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-dp-surface-alt flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-dp-text-muted" />
          </div>
          <h3 className="font-semibold text-dp-text-primary mb-2">
            {t("search.no_results")}
          </h3>
          <p className="text-dp-text-muted text-sm">{t("search.no_results_hint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sorted.map((biz) => (
            <SearchResultCard
              key={biz.id}
              biz={biz}
              locale={locale}
              t={t}
              getBizName={getBizName}
              getName={getName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({
  biz,
  locale,
  t,
  getBizName,
  getName,
}: {
  biz: BusinessListing;
  locale: string;
  t: ReturnType<typeof useTranslations>;
  getBizName: (b: BusinessListing) => string;
  getName: (obj: { name_ar: string; name_he: string; name_en: string }) => string;
}) {
  const name = getBizName(biz);
  const categoryName = getName(biz.category);
  const localityName = getName(biz.locality);

  return (
    <article className="group relative bg-dp-surface rounded-card border border-dp-border overflow-hidden shadow-card hover:shadow-overlay transition-all duration-300 hover:-translate-y-1">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-dp-surface-alt">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dp-text-primary group-hover:text-brand-iris transition-colors truncate">
              <Link href={`/${locale}/business/${biz.slug}`} className="after:absolute after:inset-0">
                {name}
              </Link>
            </h3>
            <p className="text-xs text-dp-text-muted">{categoryName}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 bg-dp-surface-alt rounded-lg px-2 py-1">
            <Star className="h-3.5 w-3.5 star-filled" />
            <span className="text-sm font-bold text-dp-text-primary num">
              {biz.rating_avg > 0 ? biz.rating_avg.toFixed(1) : "-"}
            </span>
            {biz.rating_count > 0 && (
              <span className="text-xs text-dp-text-muted">({biz.rating_count})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-dp-text-muted mb-3">
          <MapPin className="h-3.5 w-3.5 text-brand-iris" />
          <span>{localityName}</span>
        </div>

        {biz.services.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-dp-border">
            <span className="text-sm font-semibold text-dp-text-primary num">
              {t("common.currency")}{Math.min(...biz.services.map((s) => s.price))}+
            </span>
            <Button size="sm" className="relative z-10 pointer-events-auto" asChild>
              <Link href={`/${locale}/business/${biz.slug}`}>
                {t("search.book_now")}
              </Link>
            </Button>
          </div>
        )}

        {biz.services.length === 0 && (
          <div className="pt-3 border-t border-dp-border flex justify-end">
            <Button size="sm" className="relative z-10 pointer-events-auto" asChild>
              <Link href={`/${locale}/business/${biz.slug}`}>
                {t("search.book_now")}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-dp-text-muted mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-dp-text-muted">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 border border-dp-border rounded-xl bg-dp-surface text-sm text-dp-text-primary appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-brand-iris/30",
            icon ? "ps-9 pe-4" : "px-4"
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-brand-iris/10 text-brand-iris border border-brand-iris/20 rounded-full px-3 py-1 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-dp-error transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
