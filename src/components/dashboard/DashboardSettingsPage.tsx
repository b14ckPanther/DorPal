"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Props = { locale: string; isOwner: boolean };

export function DashboardSettingsPage({ locale, isOwner }: Props) {
  const t = useTranslations("dashboard");
  const [emailOnBooking, setEmailOnBooking] = useState(true);
  const [smsOnReminder, setSmsOnReminder] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/dashboard/settings").then((r) => r.json()).then((d) => {
      if (d.email_on_booking !== undefined) setEmailOnBooking(d.email_on_booking);
      if (d.sms_on_reminder !== undefined) setSmsOnReminder(d.sms_on_reminder);
    }).catch(() => {});
  }, []);

  const save = () => {
    if (!isOwner) return;
    startTransition(async () => {
      await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_on_booking: emailOnBooking, sms_on_reminder: smsOnReminder }),
      });
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("settings.title")}</h1>
        <p className="text-sm text-dp-text-muted">{t("settings.subtitle")}</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={emailOnBooking} onChange={(e) => setEmailOnBooking(e.target.checked)} disabled={!isOwner} />
            <span className="text-sm">{t("settings.email_on_booking")}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={smsOnReminder} onChange={(e) => setSmsOnReminder(e.target.checked)} disabled={!isOwner} />
            <span className="text-sm">{t("settings.sms_on_reminder")}</span>
          </label>
          {isOwner && <Button onClick={save} disabled={pending}>Save</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
