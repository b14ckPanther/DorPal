"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

type Props = { locale: string };

export function DashboardAnalyticsPage({ locale }: Props) {
  const t = useTranslations("dashboard");
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<{ bookings_count: number; revenue: number; new_customers: number; cancellation_count: number } | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/analytics?from=${from}&to=${to}`).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, [from, to]);

  const exportUrl = `/api/dashboard/analytics/export?from=${from}&to=${to}`;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dp-text-primary">{t("analytics.title")}</h1>
          <p className="text-sm text-dp-text-muted">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="h-9 rounded-md border border-dp-border px-3 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="h-9 rounded-md border border-dp-border px-3 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outline" size="sm" asChild>
            <a href={exportUrl} download><Download className="h-4 w-4 me-1" />{t("analytics.export_csv")}</a>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-dp-text-muted">{t("analytics.bookings_count")}</p>
            <p className="text-2xl font-bold text-dp-text-primary">{data?.bookings_count ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-dp-text-muted">{t("analytics.revenue")}</p>
            <p className="text-2xl font-bold text-dp-text-primary">₪{data?.revenue ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-dp-text-muted">{t("analytics.new_customers")}</p>
            <p className="text-2xl font-bold text-dp-text-primary">{data?.new_customers ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-dp-text-muted">{t("analytics.cancellations")}</p>
            <p className="text-2xl font-bold text-dp-text-primary">{data?.cancellation_count ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
