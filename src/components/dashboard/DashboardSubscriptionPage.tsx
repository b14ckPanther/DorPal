"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DashboardSubscription } from "@/lib/supabase/queries";

type Props = { locale: string };

export function DashboardSubscriptionPage({ locale }: Props) {
  const t = useTranslations("dashboard");
  const [sub, setSub] = useState<DashboardSubscription | null>(null);
  const [billing, setBilling] = useState<{ id: string; amount: number; currency: string; status: string; paid_at: string | null; created_at: string }[]>([]);

  useEffect(() => {
    fetch("/api/dashboard/subscription").then((r) => r.json()).then((d) => setSub(d?.id ? d : null));
    fetch("/api/dashboard/billing").then((r) => r.json()).then(setBilling);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("subscription.title")}</h1>
        <p className="text-sm text-dp-text-muted">{t("subscription.subtitle")}</p>
      </div>
      {sub ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-dp-text-muted">{t("subscription.plan")}</p>
                <p className="text-xl font-semibold">{sub.plan_name}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-dp-surface-alt capitalize">{sub.status}</span>
            </div>
            <p className="text-sm text-dp-text-secondary">{t("subscription.period_end")}: {new Date(sub.current_period_end).toLocaleDateString(locale)}</p>
            {sub.trial_ends_at && <p className="text-sm text-dp-warning">Trial ends: {new Date(sub.trial_ends_at).toLocaleDateString(locale)}</p>}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-dp-border">
              <div><p className="text-xs text-dp-text-muted">{t("subscription.usage_staff")}</p><p className="font-medium">{sub.usage_staff}</p></div>
              <div><p className="text-xs text-dp-text-muted">{t("subscription.usage_offers")}</p><p className="font-medium">{sub.usage_offers}</p></div>
              <div><p className="text-xs text-dp-text-muted">{t("subscription.usage_reminders")}</p><p className="font-medium">{sub.usage_reminders_this_month}</p></div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); }}>{t("subscription.manage_billing")}</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center text-dp-text-muted">No active subscription</CardContent></Card>
      )}
      <div>
        <h2 className="text-lg font-semibold mb-2">{t("subscription.billing_history")}</h2>
        <Card>
          <CardContent className="p-0">
            {billing.length === 0 ? <p className="p-4 text-sm text-dp-text-muted">No payments yet</p> : (
              <ul className="divide-y divide-dp-border">
                {billing.map((p) => (
                  <li key={p.id} className="flex justify-between items-center px-4 py-3 text-sm">
                    <span>{new Date(p.created_at).toLocaleDateString(locale)}</span>
                    <span>{p.currency} {p.amount}</span>
                    <span className="capitalize">{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
