"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarCheck,
  Users,
  BarChart3,
  Clock,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Store,
  MapPin,
  Scissors,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Locality, Category } from "@/lib/supabase/queries";

interface ApplyPageContentProps {
  locale: string;
  localities: Locality[];
  categories: Category[];
}

const BENEFITS = [
  { icon: CalendarCheck, key: "1" },
  { icon: Users, key: "2" },
  { icon: BarChart3, key: "3" },
  { icon: Clock, key: "4" },
];

export function ApplyPageContent({ locale, localities, categories }: ApplyPageContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    business_name: "",
    category_id: "",
    locality_id: "",
    address: "",
    message: "",
  });

  const getName = (obj: { name_ar: string; name_he: string; name_en: string }) =>
    locale === "ar" ? obj.name_ar : locale === "he" ? obj.name_he : obj.name_en;

  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.business_name) {
      toast.error(t("common.required"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("business_applications").insert({
        applicant_name: form.full_name,
        applicant_email: form.email,
        applicant_phone: form.phone,
        business_name_en: form.business_name,
        business_name_ar: form.business_name,
        category_id: form.category_id || null,
        locality_id: form.locality_id || null,
        address: form.address || null,
        description_en: form.message || null,
      });
      if (error) {
        console.error("Failed to submit application:", error.message);
        toast.error(t("errors.generic"));
        return;
      }
      router.push(`/${locale}/apply/thanks?email=${encodeURIComponent(form.email)}`);
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-dp-bg">
      {/* Hero */}
      <div className="relative overflow-hidden bg-dp-text-primary py-16 sm:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -start-20 w-80 h-80 rounded-full bg-brand-iris/10 blur-3xl" />
          <div className="absolute -bottom-20 -end-20 w-80 h-80 rounded-full bg-brand-plum/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-iris/20 border border-brand-iris/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-brand-iris">
              {t("apply.trial_badge")}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t("apply.title")}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {t("apply.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-dp-surface rounded-card border border-dp-border shadow-card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-dp-text-primary mb-1">
                {t("apply.form.title")}
              </h2>
              <p className="text-dp-text-muted text-sm mb-6">
                {t("apply.form.subtitle")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal section */}
                <div>
                  <h3 className="text-sm font-semibold text-dp-text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-brand-iris/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-brand-iris" />
                    </div>
                    {t("apply.section.personal")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t("apply.full_name")}
                      value={form.full_name}
                      onChange={(e) => setField("full_name", e.target.value)}
                      required
                      startIcon={<User className="h-4 w-4" />}
                    />
                    <Input
                      label={t("apply.email")}
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      required
                      startIcon={<Mail className="h-4 w-4" />}
                    />
                    <Input
                      label={t("apply.phone")}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      required
                      startIcon={<Phone className="h-4 w-4" />}
                      dir="ltr"
                      className="sm:col-span-2"
                    />
                  </div>
                </div>

                {/* Business section */}
                <div>
                  <h3 className="text-sm font-semibold text-dp-text-secondary uppercase tracking-wide mb-4 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-brand-plum/10 flex items-center justify-center">
                      <Store className="h-3 w-3 text-brand-plum" />
                    </div>
                    {t("apply.section.business")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t("apply.business_name")}
                      value={form.business_name}
                      onChange={(e) => setField("business_name", e.target.value)}
                      required
                      startIcon={<Store className="h-4 w-4" />}
                      className="sm:col-span-2"
                    />

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-dp-text-primary mb-1.5">
                        {t("apply.category")}
                      </label>
                      <div className="relative">
                        <Scissors className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-dp-text-muted pointer-events-none" />
                        <select
                          value={form.category_id}
                          onChange={(e) => setField("category_id", e.target.value)}
                          className="w-full h-11 border border-dp-border rounded-card-sm ps-10 pe-4 bg-dp-surface text-sm text-dp-text-primary focus:outline-none focus:ring-2 focus:ring-brand-iris appearance-none"
                        >
                          <option value="">
                            {locale === "ar"
                              ? "اختر الفئة"
                              : locale === "he"
                                ? "בחר קטגוריה"
                                : "Select category"}
                          </option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {getName(cat)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Locality */}
                    <div>
                      <label className="block text-sm font-medium text-dp-text-primary mb-1.5">
                        {t("apply.locality")}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-dp-text-muted pointer-events-none" />
                        <select
                          value={form.locality_id}
                          onChange={(e) => setField("locality_id", e.target.value)}
                          className="w-full h-11 border border-dp-border rounded-card-sm ps-10 pe-4 bg-dp-surface text-sm text-dp-text-primary focus:outline-none focus:ring-2 focus:ring-brand-iris appearance-none"
                        >
                          <option value="">
                            {locale === "ar"
                              ? "اختر الموقع"
                              : locale === "he"
                                ? "בחר מיקום"
                                : "Select location"}
                          </option>
                          {localities.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {getName(loc)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Input
                      label={t("apply.address")}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      startIcon={<MapPin className="h-4 w-4" />}
                      className="sm:col-span-2"
                    />

                    {/* Message */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-dp-text-primary mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4 text-dp-text-muted" />
                        {t("apply.message_label")}
                        <span className="text-dp-text-muted font-normal text-xs">
                          ({t("common.optional")})
                        </span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setField("message", e.target.value)}
                        rows={3}
                        placeholder={t("apply.message_placeholder")}
                        className="w-full border border-dp-border rounded-card-sm px-4 py-3 text-sm bg-dp-surface text-dp-text-primary placeholder:text-dp-text-muted focus:outline-none focus:ring-2 focus:ring-brand-iris resize-none"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  loading={loading}
                >
                  {loading ? t("apply.submitting") : t("apply.submit")}
                  {!loading && <ArrowIcon className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </div>

          {/* Benefits sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-dp-text-primary mb-4">
                {t("apply.benefits.title")}
              </h3>
              <div className="space-y-4">
                {BENEFITS.map(({ icon: Icon, key }) => (
                  <div
                    key={key}
                    className="flex items-start gap-3 p-4 bg-dp-surface rounded-card border border-dp-border"
                  >
                    <div className="h-10 w-10 rounded-xl bg-brand-iris/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-brand-iris" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-dp-text-primary">
                        {t(`apply.benefits.${key}.title`)}
                      </p>
                      <p className="text-xs text-dp-text-muted mt-0.5">
                        {t(`apply.benefits.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process steps */}
            <div className="bg-dp-surface-alt rounded-card p-4">
              <h4 className="font-semibold text-sm text-dp-text-primary mb-3">
                {t("apply.process.title")}
              </h4>
              <div className="space-y-2.5">
                {[
                  t("apply.process.step1"),
                  t("apply.process.step2"),
                  t("apply.process.step3"),
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-brand-iris flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-xs text-dp-text-secondary">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
