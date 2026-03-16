"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BusinessHour, BusinessProfile, Category, Locality } from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Props = {
  locale: string;
  business: BusinessProfile;
  localities: Locality[];
  categories: Category[];
};

const DAYS_LABELS: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function getLabel(day: number, t: ReturnType<typeof useTranslations>) {
  const key = DAYS_LABELS[day];
  if (!key) return "";
  return t(`common.days.${key}` as "common.days.sunday");
}

export function BusinessProfileForm({ locale, business, localities, categories }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formState, setFormState] = useState({
    name_ar: business.name_ar ?? "",
    name_he: business.name_he ?? "",
    name_en: business.name_en ?? "",
    description_ar: business.description_ar ?? "",
    description_he: business.description_he ?? "",
    description_en: business.description_en ?? "",
    logo_url: business.logo_url ?? "",
    cover_url: business.cover_url ?? "",
    address: business.address ?? "",
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    email: business.email ?? "",
    instagram_url: business.instagram_url ?? "",
    tiktok_url: business.tiktok_url ?? "",
    facebook_url: business.facebook_url ?? "",
    waze_url: business.waze_url ?? "",
    locality_id: (business.locality as any)?.id ?? "",
    category_id: (business.category as any)?.id ?? "",
  });

  const [hours, setHours] = useState<BusinessHour[]>(() => {
    const byDay: Record<number, BusinessHour> = {};
    for (let d = 0; d <= 6; d++) {
      byDay[d] = {
        day_of_week: d,
        start_time: null,
        end_time: null,
        is_closed: true,
      };
    }
    for (const h of business.hours ?? []) {
      byDay[h.day_of_week] = h;
    }
    return Object.values(byDay).sort((a, b) => a.day_of_week - b.day_of_week);
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload(
    file: File,
    kind: "logo" | "cover"
  ) {
    // Debug visibility
    // eslint-disable-next-line no-console
    console.log("Uploading business image", { kind, name: file.name, size: file.size });

    const supabase = createClient();
    const bucket = "business-assets";
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${kind}s/${business.id}-${Date.now()}.${ext}`;
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingCover;
    setUploading(true);
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Upload failed:", error.message);
        toast.error("Image upload failed", { description: error.message });
        return;
      }
      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
      const url = publicUrl.publicUrl;
      setFormState((s) => ({
        ...s,
        logo_url: kind === "logo" ? url : s.logo_url,
        cover_url: kind === "cover" ? url : s.cover_url,
      }));
      toast.success(kind === "logo" ? "Logo uploaded" : "Cover uploaded");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      ...formState,
      hours,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to save profile");
        }

        setSuccess(t("dashboard.profile.saved"));
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function updateHour(idx: number, patch: Partial<BusinessHour>) {
    setHours((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">
          {t("dashboard.profile.title")}
        </h1>
        <p className="text-sm text-dp-text-muted mt-1">
          {t("dashboard.profile.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("dashboard.profile.identity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Arabic name
                </label>
                <Input
                  value={formState.name_ar}
                  onChange={(e) => setFormState((s) => ({ ...s, name_ar: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Hebrew name
                </label>
                <Input
                  value={formState.name_he}
                  onChange={(e) => setFormState((s) => ({ ...s, name_he: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  English name
                </label>
                <Input
                  required
                  value={formState.name_en}
                  onChange={(e) => setFormState((s) => ({ ...s, name_en: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Logo
                </label>
                {formState.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formState.logo_url}
                    alt="Logo"
                    className="h-16 w-16 rounded-xl border border-dp-border object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file, "logo");
                  }}
                  disabled={uploadingLogo}
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Cover
                </label>
                {formState.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formState.cover_url}
                    alt="Cover"
                    className="h-16 w-full max-w-xs rounded-xl border border-dp-border object-cover"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file, "cover");
                  }}
                  disabled={uploadingCover}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Address
                </label>
                <Input
                  value={formState.address}
                  onChange={(e) => setFormState((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                    Phone
                  </label>
                  <Input
                    value={formState.phone}
                    onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                    WhatsApp
                  </label>
                  <Input
                    value={formState.whatsapp}
                    onChange={(e) => setFormState((s) => ({ ...s, whatsapp: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Social links
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 shrink-0 text-dp-text-muted">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="17" cy="7" r="0.9" fill="currentColor" />
                      </svg>
                    </span>
                    <Input
                      placeholder="Instagram URL"
                      value={formState.instagram_url}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, instagram_url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 shrink-0 text-dp-text-muted">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M9.5 3.5v4.2c0 1.6 1.3 2.9 2.9 2.9 0.5 0 1-0.1 1.4-0.4v2.3c-0.7 0.3-1.4 0.4-2.1 0.4-3 0-5.4-2.4-5.4-5.4V3.5h3.2z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <Input
                      placeholder="TikTok URL"
                      value={formState.tiktok_url}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, tiktok_url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 shrink-0 text-dp-text-muted">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M13 5h3V2h-3c-3 0-5 2-5 5v3H5v3h3v7h3v-7h3v-3h-3V7c0-1.1.9-2 2-2z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <Input
                      placeholder="Facebook URL"
                      value={formState.facebook_url}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, facebook_url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 shrink-0 text-dp-text-muted">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path
                          d="M5 14c0 3 2.7 5 7 5 4.2 0 7-2 7-5-1.2-3.5-2-5-4-7H9C7 9 6.2 10.5 5 14z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle cx="9" cy="13" r="0.9" fill="currentColor" />
                        <circle cx="13" cy="15" r="0.9" fill="currentColor" />
                        <circle cx="17" cy="13" r="0.9" fill="currentColor" />
                      </svg>
                    </span>
                    <Input
                      placeholder="Waze URL"
                      value={formState.waze_url}
                      onChange={(e) =>
                        setFormState((s) => ({ ...s, waze_url: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Locality
                </label>
                <select
                  className={cn(
                    "w-full h-10 rounded-md border border-dp-border bg-dp-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-iris"
                  )}
                  value={formState.locality_id}
                  onChange={(e) => setFormState((s) => ({ ...s, locality_id: e.target.value }))}
                  required
                >
                  <option value="">Select locality</option>
                  {localities.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {locale === "ar"
                        ? loc.name_ar
                        : locale === "he"
                        ? loc.name_he
                        : loc.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">
                  Category
                </label>
                <select
                  className={cn(
                    "w-full h-10 rounded-md border border-dp-border bg-dp-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-iris"
                  )}
                  value={formState.category_id}
                  onChange={(e) => setFormState((s) => ({ ...s, category_id: e.target.value }))}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {locale === "ar"
                        ? cat.name_ar
                        : locale === "he"
                        ? cat.name_he
                        : cat.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("dashboard.profile.opening_hours")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1.5fr,1fr,1fr,auto] gap-3 text-xs text-dp-text-muted">
              <span>
                {t("dashboard.profile.day")}
              </span>
              <span>
                {t("common.from")}
              </span>
              <span>
                {t("common.to")}
              </span>
              <span>
                {t("business.closed")}
              </span>
            </div>
            {hours.map((h, idx) => (
              <div
                key={h.day_of_week}
                className="grid grid-cols-[1.5fr,1fr,1fr,auto] gap-3 items-center"
              >
                <span className="text-sm text-dp-text-secondary">
                  {getLabel(h.day_of_week, t)}
                </span>
                <Input
                  type="time"
                  disabled={h.is_closed}
                  value={h.start_time ?? ""}
                  onChange={(e) =>
                    updateHour(idx, { start_time: e.target.value || null, is_closed: false })
                  }
                />
                <Input
                  type="time"
                  disabled={h.is_closed}
                  value={h.end_time ?? ""}
                  onChange={(e) =>
                    updateHour(idx, { end_time: e.target.value || null, is_closed: false })
                  }
                />
                <label className="inline-flex items-center gap-2 text-xs text-dp-text-secondary">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateHour(idx, {
                          is_closed: true,
                          start_time: h.start_time ?? "00:00",
                          end_time: h.end_time ?? "00:00",
                        });
                      } else {
                        updateHour(idx, { is_closed: false });
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="text-sm text-dp-error bg-dp-error-bg rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-dp-success bg-dp-success-bg rounded-md px-3 py-2">
            {success}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? t("dashboard.profile.saving")
              : t("dashboard.profile.save_changes")}
          </Button>
        </div>
      </form>
    </div>
  );
}

