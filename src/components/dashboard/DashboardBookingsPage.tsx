"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BookingListItem } from "@/lib/supabase/queries";
import type { DashboardStaff } from "@/lib/supabase/queries";
import type { DashboardService } from "@/lib/supabase/queries";
import { CalendarCheck, X } from "lucide-react";

type Props = {
  locale: string;
  staffList: DashboardStaff[];
  serviceList: DashboardService[];
  businessSlug: string;
};

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "no_show"];

export function DashboardBookingsPage({ locale, staffList, serviceList, businessSlug }: Props) {
  const t = useTranslations("dashboard");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [list, setList] = useState<BookingListItem[]>([]);
  const [selected, setSelected] = useState<BookingListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    if (staffId) params.set("staff_id", staffId);
    if (serviceId) params.set("service_id", serviceId);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/bookings?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setList(data ?? []);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function runAction(id: string, action: "cancel" | "no_show") {
    setActionError(null);
    const res = await fetch(`/api/dashboard/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.message ?? "Failed");
      return;
    }
    setList((prev) => prev.map((b) => (b.id === id ? { ...b, status: action === "cancel" ? "cancelled" : "no_show" } : b)));
    setSelected(null);
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("bookings.title")}</h1>
        <p className="text-sm text-dp-text-muted mt-0.5">{t("bookings.no_bookings_hint")}</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <input
            type="date"
            className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder={t("bookings.date_from")}
          />
          <input
            type="date"
            className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={t("bookings.date_to")}
          />
          <select className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("bookings.status")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{t(`status.${s}` as "pending") || s}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">{t("bookings.staff")}</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name_en || s.name_ar || s.name_he}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">{t("bookings.service")}</option>
            {serviceList.map((s) => (
              <option key={s.id} value={s.id}>{s.name_en || s.name_ar || s.name_he}</option>
            ))}
          </select>
          <Button size="sm" onClick={load} disabled={isPending}>{t("bookings.apply_filters")}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="py-12 text-center text-dp-text-muted">
              <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("bookings.no_bookings")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start p-3 font-medium">Date / Time</th>
                    <th className="text-start p-3 font-medium">Customer</th>
                    <th className="text-start p-3 font-medium">Service</th>
                    <th className="text-start p-3 font-medium">Staff</th>
                    <th className="text-start p-3 font-medium">Status</th>
                    <th className="text-end p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className="border-b border-dp-border hover:bg-dp-surface-alt">
                      <td className="p-3 tabular-nums">
                        {new Date(b.start_at).toLocaleDateString(locale)} {new Date(b.start_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3">{b.customer_name || b.guest_name || "—"}</td>
                      <td className="p-3">{b.service_names.join(", ") || "—"}</td>
                      <td className="p-3">{b.staff_name || "—"}</td>
                      <td className="p-3">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          b.status === "cancelled" ? "bg-dp-error-bg text-dp-error" : b.status === "no_show" ? "bg-dp-warning-bg text-dp-warning" : "bg-dp-surface-alt"
                        )}>{b.status}</span>
                      </td>
                      <td className="p-3 text-end">
                        {b.status !== "cancelled" && b.status !== "no_show" && (
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="xs" onClick={() => runAction(b.id, "cancel")}>{t("actions.cancel")}</Button>
                            <Button variant="ghost" size="xs" onClick={() => runAction(b.id, "no_show")}>{t("bookings.no_show")}</Button>
                          </div>
                        )}
                        <Button variant="link" size="xs" onClick={() => setSelected(b)}>{t("actions.view")}</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setSelected(null); setActionError(null); }} aria-hidden />
          <div className={cn("fixed top-0 bottom-0 w-full max-w-md bg-dp-surface border shadow-xl z-50 overflow-y-auto", locale === "ar" || locale === "he" ? "left-0 border-e" : "right-0 border-s")}>
            <div className="p-4 border-b border-dp-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("actions.view")}</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => { setSelected(null); setActionError(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              <p className="font-medium">{selected.customer_name || selected.guest_name || "—"}</p>
              <p className="text-sm text-dp-text-muted">{selected.service_names.join(", ")}</p>
              <p className="text-sm">{new Date(selected.start_at).toLocaleString(locale)}</p>
              <p className="text-sm">₪{selected.total_price} · {selected.status}</p>
              {actionError && <p className="text-sm text-dp-error">{actionError}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status !== "cancelled" && selected.status !== "no_show" && (
                  <>
                    <Button variant="danger-ghost" size="sm" onClick={() => runAction(selected.id, "cancel")}>{t("actions.cancel")}</Button>
                    <Button variant="secondary" size="sm" onClick={() => runAction(selected.id, "no_show")}>{t("bookings.no_show")}</Button>
                  </>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href={`/${locale}/business/${businessSlug}`} target="_blank" rel="noopener noreferrer">{t("bookings.view_profile")}</a>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
