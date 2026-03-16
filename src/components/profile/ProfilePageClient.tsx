"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { User, LayoutDashboard, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Profile = { full_name?: string; email?: string; phone?: string; role?: string } | null;

export function ProfilePageClient({ locale, profile }: { locale: string; profile: Profile }) {
  const t = useTranslations();
  const isBusiness = profile?.role === "business_owner" || profile?.role === "staff";
  const isAdmin = profile?.role === "super_admin";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dp-text-primary">{t("nav.profile")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("common.account_info")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-dp-text-muted">{t("common.name")}:</span> {profile?.full_name ?? "—"}</p>
          <p><span className="text-dp-text-muted">{t("common.email")}:</span> {profile?.email ?? "—"}</p>
          {profile?.phone && <p><span className="text-dp-text-muted">{t("common.phone")}:</span> {profile.phone}</p>}
          <p><span className="text-dp-text-muted">{t("common.role")}:</span> {profile?.role ?? "—"}</p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/${locale}/my-bookings`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dp-surface border border-dp-border text-sm font-medium hover:bg-dp-surface-alt"
        >
          <CalendarDays className="h-4 w-4" />
          {t("nav.my_bookings")}
        </Link>
        {isBusiness && (
          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-iris text-white text-sm font-medium hover:opacity-90"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("nav.dashboard")}
          </Link>
        )}
        {isAdmin && (
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dp-error/90 text-white text-sm font-medium hover:opacity-90"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>
        )}
      </div>
    </div>
  );
}
