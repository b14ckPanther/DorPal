"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  MapPin,
  Scissors,
  ChevronDown,
  TrendingUp,
  Users,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Locality, Category } from "@/lib/supabase/queries";

interface HeroSectionProps {
  locale: string;
  localities: Locality[];
  categories: Category[];
}

const STATS = [
  { key: "businesses", icon: TrendingUp, color: "text-brand-iris" },
  { key: "bookings", icon: Users, color: "text-brand-cyan" },
  { key: "cities", icon: MapPin, color: "text-brand-plum" },
];

export function HeroSection({ locale, localities, categories }: HeroSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [localityOpen, setLocalityOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const getLocalityName = (loc: Locality) =>
    locale === "ar" ? loc.name_ar : locale === "he" ? loc.name_he : loc.name_en;

  const getCategoryName = (cat: Category) =>
    locale === "ar" ? cat.name_ar : locale === "he" ? cat.name_he : cat.name_en;

  const selectedLocality = localities.find((l) => l.id === localityId);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  function handleSearch() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (localityId) params.set("locality", localityId);
    if (categoryId) params.set("category", categoryId);
    router.push(`/${locale}/search?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden hero-gradient min-h-[600px] sm:min-h-[680px] flex items-center">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-brand-plum/10 blur-3xl" />
        <div className="absolute top-1/3 -end-16 w-64 h-64 rounded-full bg-brand-iris/10 blur-3xl" />
        <div className="absolute -bottom-16 start-1/3 w-80 h-80 rounded-full bg-brand-cyan/8 blur-3xl" />

        {/* Floating elements */}
        <FloatingCard
          className="hidden lg:flex top-16 end-8 xl:end-20"
          delay={0}
          content={
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-dp-success-bg flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-dp-success" />
              </div>
              <div>
                <p className="text-xs font-semibold text-dp-text-primary">
                  {t("home.hero.floating_confirmed")}
                </p>
                <p className="text-xs text-dp-text-muted">{t("home.hero.floating_confirmed_sub")}</p>
              </div>
            </div>
          }
        />
        <FloatingCard
          className="hidden lg:flex bottom-24 start-4 xl:start-12"
          delay={0.5}
          content={
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 star-filled shrink-0" />
              <div>
                <p className="text-xs font-semibold text-dp-text-primary num">4.9/5</p>
                <p className="text-xs text-dp-text-muted">{t("home.hero.floating_rating_sub")}</p>
              </div>
            </div>
          }
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-brand-iris/10 border border-brand-iris/20 rounded-full px-4 py-1.5 mb-6"
          >
            <span className="text-sm font-medium text-brand-iris">
              {t("home.hero.eyebrow")}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dp-text-primary leading-tight mb-3"
          >
            {t("home.hero.title")}{" "}
            <span className="gradient-text block sm:inline">
              {t("home.hero.title_highlight")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-dp-text-secondary text-lg sm:text-xl mb-8 leading-relaxed"
          >
            {t("home.hero.subtitle")}
          </motion.p>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-dp-surface rounded-2xl shadow-modal border border-dp-border p-3 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Query input */}
              <div className="flex-1 relative">
                <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-dp-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("home.search.placeholder")}
                  className="w-full h-11 ps-10 pe-4 bg-dp-surface-alt rounded-xl text-sm text-dp-text-primary placeholder:text-dp-text-muted focus:outline-none focus:ring-2 focus:ring-brand-iris/30 transition-all"
                />
              </div>

              {/* Locality dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setLocalityOpen(!localityOpen);
                    setCategoryOpen(false);
                  }}
                  className="flex items-center gap-2 h-11 px-4 bg-dp-surface-alt rounded-xl text-sm whitespace-nowrap hover:bg-dp-border transition-colors"
                >
                  <MapPin className="h-4 w-4 text-brand-iris shrink-0" />
                  <span className="text-dp-text-primary max-w-[100px] truncate">
                    {selectedLocality
                      ? getLocalityName(selectedLocality)
                      : t("home.search.all_localities")}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-dp-text-muted" />
                </button>
                {localityOpen && (
                  <div className="absolute z-50 top-full mt-1 start-0 bg-dp-surface border border-dp-border rounded-card shadow-overlay min-w-[180px] max-h-60 overflow-y-auto py-1">
                    <DropdownItem
                      label={t("home.search.all_localities")}
                      active={!localityId}
                      onClick={() => {
                        setLocalityId("");
                        setLocalityOpen(false);
                      }}
                    />
                    {localities.map((loc) => (
                      <DropdownItem
                        key={loc.id}
                        label={getLocalityName(loc)}
                        active={localityId === loc.id}
                        onClick={() => {
                          setLocalityId(loc.id);
                          setLocalityOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Category dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setCategoryOpen(!categoryOpen);
                    setLocalityOpen(false);
                  }}
                  className="flex items-center gap-2 h-11 px-4 bg-dp-surface-alt rounded-xl text-sm whitespace-nowrap hover:bg-dp-border transition-colors"
                >
                  <Scissors className="h-4 w-4 text-brand-iris shrink-0" />
                  <span className="text-dp-text-primary max-w-[100px] truncate">
                    {selectedCategory
                      ? getCategoryName(selectedCategory)
                      : t("home.search.all_categories")}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-dp-text-muted" />
                </button>
                {categoryOpen && (
                  <div className="absolute z-50 top-full mt-1 start-0 bg-dp-surface border border-dp-border rounded-card shadow-overlay min-w-[180px] max-h-60 overflow-y-auto py-1">
                    <DropdownItem
                      label={t("home.search.all_categories")}
                      active={!categoryId}
                      onClick={() => {
                        setCategoryId("");
                        setCategoryOpen(false);
                      }}
                    />
                    {categories.map((cat) => (
                      <DropdownItem
                        key={cat.id}
                        label={getCategoryName(cat)}
                        active={categoryId === cat.id}
                        onClick={() => {
                          setCategoryId(cat.id);
                          setCategoryOpen(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Search button */}
              <Button
                size="md"
                onClick={handleSearch}
                className="h-11 px-6 rounded-xl shrink-0"
              >
                <Search className="h-4 w-4" />
                <span>{t("home.search.button")}</span>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap"
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.key}
                className="flex flex-col items-center gap-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className={cn("text-2xl font-bold num", stat.color)}>
                  {t(`home.hero.stats.${stat.key}_value`)}
                </span>
                <span className="text-xs text-dp-text-muted">
                  {t(`home.hero.stats.${stat.key}`)}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({
  className,
  delay,
  content,
}: {
  className?: string;
  delay: number;
  content: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
      className={cn(
        "absolute glass rounded-xl border border-dp-border shadow-overlay px-4 py-3",
        className
      )}
    >
      {content}
    </motion.div>
  );
}

function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full text-start px-3 py-2 text-sm transition-colors",
        active
          ? "text-brand-iris font-medium bg-brand-iris/8"
          : "text-dp-text-primary hover:bg-dp-surface-alt"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
