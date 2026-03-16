"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  MapPin, Phone, MessageCircle, Star, Clock,
  CheckCircle2, Tag, ChevronRight, ChevronLeft,
  ArrowRight, ArrowLeft, Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";
import type { BusinessProfile } from "@/lib/supabase/queries";

interface BusinessProfilePageProps {
  locale: string;
  slug: string;
  business: BusinessProfile | null;
}

export function BusinessProfilePage({ locale, slug, business }: BusinessProfilePageProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<"services" | "staff" | "reviews" | "hours">("services");

  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;
  const ChevIcon = locale === "en" ? ChevronRight : ChevronLeft;
  const today = new Date().getDay();

  const getDays = () => [
    t("common.days.sunday"),
    t("common.days.monday"),
    t("common.days.tuesday"),
    t("common.days.wednesday"),
    t("common.days.thursday"),
    t("common.days.friday"),
    t("common.days.saturday"),
  ];

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-dp-surface-alt flex items-center justify-center mb-4">
          <Search className="h-7 w-7 text-dp-text-muted" />
        </div>
        <h1 className="text-xl font-bold text-dp-text-primary mb-2">
          {t("errors.not_found")}
        </h1>
        <p className="text-dp-text-muted mb-6">{t("errors.business_not_found")}</p>
        <Button asChild>
          <Link href={`/${locale}/search`}>{t("common.see_all")}</Link>
        </Button>
      </div>
    );
  }

  const biz = business;

  const getName = (obj: { name_ar?: string | null; name_he?: string | null; name_en: string }) =>
    locale === "ar"
      ? (obj.name_ar ?? obj.name_en)
      : locale === "he"
        ? (obj.name_he ?? obj.name_en)
        : obj.name_en;

  const getDesc = (obj: { description_ar?: string | null; description_he?: string | null; description_en?: string | null }) =>
    locale === "ar"
      ? (obj.description_ar ?? obj.description_en)
      : locale === "he"
        ? (obj.description_he ?? obj.description_en)
        : obj.description_en;

  const getOfferTitle = (offer: BusinessProfile["offers"][0]) =>
    locale === "ar"
      ? (offer.title_ar ?? offer.title_en)
      : locale === "he"
        ? (offer.title_he ?? offer.title_en)
        : offer.title_en;

  const bizName = getName(biz);
  const bizDesc = getDesc(biz);

  const tabs = ["services", "staff", "reviews", "hours"] as const;
  const visibleTabs = tabs.filter((tab) => {
    if (tab === "services") return biz.services.length > 0;
    if (tab === "staff") return biz.staff.length > 0;
    if (tab === "reviews") return biz.reviews.length > 0;
    if (tab === "hours") return biz.hours.length > 0;
    return false;
  });

  return (
    <div className="bg-dp-bg">
      {/* Hero / Cover */}
      <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden bg-dp-surface-alt">
        {biz.cover_url ? (
          <Image
            src={biz.cover_url}
            alt={bizName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-plum" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 start-4">
          <div className="flex items-center gap-1 text-white/70 text-xs">
            <Link href={`/${locale}`} className="hover:text-white transition-colors">
              {t("nav.home")}
            </Link>
            <ChevIcon className="h-3 w-3" />
            <Link href={`/${locale}/search`} className="hover:text-white transition-colors">
              {t("nav.search")}
            </Link>
            <ChevIcon className="h-3 w-3" />
            <span className="text-white truncate max-w-[120px]">{bizName}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Business header card */}
        <div className="relative -mt-16 mb-6">
          <div className="bg-dp-surface rounded-card border border-dp-border shadow-modal p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-dp-border overflow-hidden shadow-card bg-dp-surface shrink-0 -mt-10 sm:-mt-14 flex items-center justify-center">
                {biz.logo_url ? (
                  <Image
                    src={biz.logo_url}
                    alt={bizName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-plum flex items-center justify-center text-white font-bold text-2xl">
                    {bizName[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-dp-text-primary">
                    {bizName}
                  </h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-dp-text-muted">
                  <span className="text-dp-text-secondary font-medium">
                    {getName(biz.category)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-iris" />
                    {getName(biz.locality)}
                  </span>
                </div>

                {biz.rating_avg > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={biz.rating_avg} size="md" />
                    <span className="text-sm font-semibold text-dp-text-primary num">
                      {biz.rating_avg.toFixed(1)}
                    </span>
                    {biz.rating_count > 0 && (
                      <span className="text-sm text-dp-text-muted">
                        ({biz.rating_count} {t("business.reviews")})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {(biz.phone || biz.whatsapp) && (
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {biz.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => window.open(`tel:${biz.phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                      {t("business.call")}
                    </Button>
                  )}
                  {biz.whatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => window.open(`https://wa.me/${biz.whatsapp!.replace(/\D/g, "")}`)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {t("business.whatsapp")}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile actions */}
            {(biz.phone || biz.whatsapp) && (
              <div className="flex items-center gap-2 mt-4 sm:hidden">
                {biz.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => window.open(`tel:${biz.phone}`)}
                  >
                    <Phone className="h-4 w-4" />
                    {t("business.call")}
                  </Button>
                )}
                {biz.whatsapp && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => window.open(`https://wa.me/${biz.whatsapp!.replace(/\D/g, "")}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offer banner */}
            {biz.offers.length > 0 && (
              <div className="bg-dp-warning-bg border border-dp-warning/30 rounded-card p-4 flex items-start gap-3">
                <Tag className="h-5 w-5 text-dp-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-dp-text-primary text-sm">
                    {getOfferTitle(biz.offers[0])}
                  </p>
                  {getDesc(biz.offers[0]) && (
                    <p className="text-xs text-dp-text-muted mt-0.5">
                      {getDesc(biz.offers[0])}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* About */}
            {bizDesc && (
              <section>
                <h2 className="text-base font-semibold text-dp-text-primary mb-3">
                  {t("business.about")}
                </h2>
                <p className="text-dp-text-secondary text-sm leading-relaxed">
                  {bizDesc}
                </p>
              </section>
            )}

            {/* Tabs */}
            {visibleTabs.length > 0 && (
              <div>
                <div className="flex border-b border-dp-border mb-4 overflow-x-auto gap-0">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                        activeTab === tab
                          ? "border-brand-iris text-brand-iris"
                          : "border-transparent text-dp-text-muted hover:text-dp-text-primary"
                      )}
                    >
                      {t(`business.${tab}`)}
                    </button>
                  ))}
                </div>

                {/* Services */}
                {activeTab === "services" && biz.services.length > 0 && (
                  <div className="space-y-3">
                    {biz.services.map((service) => {
                      const sName = getName(service);
                      const sDesc = getDesc(service);
                      return (
                        <div
                          key={service.id}
                          className="bg-dp-surface border border-dp-border rounded-card p-4 flex items-center justify-between gap-3 hover:border-brand-iris/30 hover:shadow-raised transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-dp-text-primary">{sName}</p>
                            {sDesc && (
                              <p className="text-xs text-dp-text-muted mt-0.5">{sDesc}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="flex items-center gap-1 text-xs text-dp-text-muted">
                                <Clock className="h-3.5 w-3.5" />
                                {service.duration_minutes} {t("common.minutes")}
                              </span>
                              {service.deposit_required && service.deposit_amount && (
                                <span className="text-xs text-dp-warning bg-dp-warning-bg px-1.5 py-0.5 rounded">
                                  {t("business.deposit_required")}: {t("common.currency")}{service.deposit_amount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-end shrink-0">
                            <p className="font-bold text-dp-text-primary text-base num">
                              {t("common.currency")}{service.price}
                            </p>
                            <Button size="sm" className="mt-2" asChild>
                              <Link href={`/${locale}/business/${slug}/book?service=${service.id}`}>
                                {t("business.book")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Staff */}
                {activeTab === "staff" && biz.staff.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {biz.staff.map((member) => {
                      const memberName = getName(member);
                      const roleTitle =
                        locale === "ar"
                          ? (member.role_title_ar ?? member.role_title_en)
                          : locale === "he"
                            ? (member.role_title_he ?? member.role_title_en)
                            : member.role_title_en;
                      return (
                        <div
                          key={member.id}
                          className="bg-dp-surface border border-dp-border rounded-card p-4 flex items-center gap-3"
                        >
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-brand-iris shrink-0 flex items-center justify-center">
                            {member.photo_url ? (
                              <Image
                                src={member.photo_url}
                                alt={memberName}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-white font-bold text-lg">
                                {memberName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-dp-text-primary">{memberName}</p>
                            {roleTitle && (
                              <p className="text-xs text-dp-text-muted">{roleTitle}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && biz.reviews.length > 0 && (
                  <div className="space-y-4">
                    {biz.rating_avg > 0 && (
                      <div className="bg-dp-surface-alt rounded-card p-4 flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-dp-text-primary num">
                            {biz.rating_avg.toFixed(1)}
                          </div>
                          <StarRating rating={biz.rating_avg} size="md" className="justify-center my-1" />
                          {biz.rating_count > 0 && (
                            <p className="text-xs text-dp-text-muted">
                              {biz.rating_count} {t("business.reviews")}
                            </p>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-dp-text-muted w-3 num">{star}</span>
                              <Star className="h-3.5 w-3.5 star-filled shrink-0" />
                              <div className="flex-1 h-1.5 bg-dp-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand-iris rounded-full"
                                  style={{
                                    width: `${biz.reviews.filter((r) => r.rating === star).length / biz.reviews.length * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {biz.reviews.map((review) => {
                      const reviewText =
                        locale === "ar"
                          ? (review.body_ar ?? review.body_en)
                          : locale === "he"
                            ? (review.body_he ?? review.body_en)
                            : review.body_en;
                      const reviewDate = new Date(review.created_at).toLocaleDateString(
                        locale === "ar" ? "ar-IL" : locale === "he" ? "he-IL" : "en-IL"
                      );
                      return (
                        <div
                          key={review.id}
                          className="bg-dp-surface border border-dp-border rounded-card p-4"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="h-9 w-9 rounded-full bg-brand-iris flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {(review.customer_name ?? t("common.anonymous"))[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-dp-text-primary">
                                  {review.customer_name ?? t("common.anonymous")}
                                </p>
                                <p className="text-xs text-dp-text-muted">{reviewDate}</p>
                              </div>
                            </div>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          {reviewText && (
                            <p className="text-sm text-dp-text-secondary leading-relaxed">
                              {reviewText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hours */}
                {activeTab === "hours" && biz.hours.length > 0 && (
                  <div className="space-y-2">
                    {biz.hours.map((h) => {
                      const dayName = getDays()[h.day_of_week];
                      const isToday = h.day_of_week === today;
                      return (
                        <div
                          key={h.day_of_week}
                          className={cn(
                            "flex items-center justify-between py-2.5 px-3 rounded-lg",
                            isToday
                              ? "bg-brand-iris/8 border border-brand-iris/20"
                              : "hover:bg-dp-surface-alt"
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isToday ? "text-brand-iris" : "text-dp-text-primary"
                            )}
                          >
                            {dayName}
                            {isToday && (
                              <span className="ms-2 text-xs">
                                ({t("common.today")})
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "text-sm num",
                              h.is_closed ? "text-dp-error" : "text-dp-text-secondary"
                            )}
                          >
                            {h.is_closed
                              ? t("business.closed")
                              : `${h.start_time} - ${h.end_time}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Booking CTA sidebar */}
          <div className="space-y-4">
            {/* Book now card */}
            <div className="bg-dp-surface border border-dp-border rounded-card shadow-card p-5 sticky top-20">
              <h3 className="font-semibold text-dp-text-primary mb-1">
                {t("business.book")}
              </h3>
              <p className="text-sm text-dp-text-muted mb-4">
                {t("business.book_subtitle")}
              </p>

              {/* Service quick pick */}
              {biz.services.length > 0 && (
                <div className="space-y-2 mb-4">
                  {biz.services.slice(0, 3).map((s) => (
                    <Link
                      key={s.id}
                      href={`/${locale}/business/${slug}/book?service=${s.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-dp-border hover:border-brand-iris/40 hover:bg-brand-iris/5 transition-all group"
                    >
                      <div>
                        <p className="text-sm font-medium text-dp-text-primary group-hover:text-brand-iris">
                          {getName(s)}
                        </p>
                        <p className="text-xs text-dp-text-muted">
                          {s.duration_minutes} {t("common.minutes")}
                        </p>
                      </div>
                      <span className="font-bold text-dp-text-primary text-sm num">
                        {t("common.currency")}{s.price}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              <Button size="lg" className="w-full gap-2" asChild>
                <Link href={`/${locale}/business/${slug}/book`}>
                  {t("business.book")}
                </Link>
              </Button>

              <div className="mt-3 flex items-center gap-3 justify-center text-xs text-dp-text-muted">
                <CheckCircle2 className="h-4 w-4 text-dp-success" />
                {t("business.instant_confirm")}
              </div>
            </div>

            {/* Address card */}
            {biz.address && (
              <div className="bg-dp-surface border border-dp-border rounded-card p-4">
                <h3 className="font-medium text-dp-text-primary text-sm mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-iris" />
                  {t("business.location")}
                </h3>
                <p className="text-sm text-dp-text-secondary">{biz.address}</p>
              </div>
            )}

            {/* Contact card */}
            {(biz.phone || biz.whatsapp) && (
              <div className="bg-dp-surface border border-dp-border rounded-card p-4 space-y-2">
                <h3 className="font-medium text-dp-text-primary text-sm mb-2">
                  {t("business.contact")}
                </h3>
                {biz.phone && (
                  <a
                    href={`tel:${biz.phone}`}
                    className="flex items-center gap-2.5 text-sm text-dp-text-secondary hover:text-brand-iris transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-brand-iris" />
                    <span dir="ltr">{biz.phone}</span>
                  </a>
                )}
                {biz.whatsapp && (
                  <a
                    href={`https://wa.me/${biz.whatsapp.replace(/\D/g, "")}`}
                    className="flex items-center gap-2.5 text-sm text-dp-text-secondary hover:text-brand-iris transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-brand-iris" />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
