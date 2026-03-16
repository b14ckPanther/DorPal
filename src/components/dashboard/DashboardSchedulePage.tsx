"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ScheduleAppointment, ScheduleBlock } from "@/lib/supabase/queries";
import type { DashboardStaff } from "@/lib/supabase/queries";
import { ChevronLeft, ChevronRight, X, User, Clock } from "lucide-react";

type Props = {
  locale: string;
  staffList: DashboardStaff[];
  businessSlug: string;
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function DashboardSchedulePage({ locale, staffList, businessSlug }: Props) {
  const t = useTranslations("dashboard");
  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [staffId, setStaffId] = useState<string>("");
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [selected, setSelected] = useState<ScheduleAppointment | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const from = view === "day" ? toDateStr(anchor) : toDateStr(startOfWeek(anchor));
  const toDate = view === "day" ? anchor : (() => {
    const end = new Date(startOfWeek(anchor));
    end.setDate(end.getDate() + 6);
    return end;
  })();
  const to = toDateStr(toDate);

  useEffect(() => {
    const params = new URLSearchParams({ from, to });
    if (staffId) params.set("staff_id", staffId);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/schedule?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments ?? []);
      setBlocks(data.blocks ?? []);
    });
  }, [from, to, staffId]);

  function prev() {
    const next = new Date(anchor);
    if (view === "day") next.setDate(next.getDate() - 1);
    else next.setDate(next.getDate() - 7);
    setAnchor(next);
  }

  function next() {
    const next = new Date(anchor);
    if (view === "day") next.setDate(next.getDate() + 1);
    else next.setDate(next.getDate() + 7);
    setAnchor(next);
  }

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchor(d);
  }

  async function runAction(action: "cancel" | "no_show") {
    if (!selected) return;
    setActionError(null);
    const res = await fetch(`/api/dashboard/appointments/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.message ?? "Failed");
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: action === "cancel" ? "cancelled" : "no_show" } : a)));
    setSelected(null);
  }

  const groupedByDay: Record<string, ScheduleAppointment[]> = {};
  appointments.forEach((a) => {
    const day = a.start_at.slice(0, 10);
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(a);
  });

  const displayRange = view === "day" ? from : `${from} — ${to}`;

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("schedule.title")}</h1>
        <p className="text-sm text-dp-text-muted mt-0.5">{t("schedule.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-dp-border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("day")}
              className={cn("px-3 py-1.5 text-sm", view === "day" ? "bg-brand-iris text-white" : "bg-dp-surface-alt")}
            >
              {t("schedule.day")}
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn("px-3 py-1.5 text-sm", view === "week" ? "bg-brand-iris text-white" : "bg-dp-surface-alt")}
            >
              {t("schedule.week")}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={prev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={today}>
              {locale === "ar" ? "اليوم" : locale === "he" ? "היום" : "Today"}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={next}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-dp-text-secondary">{displayRange}</span>
          <select
            className="h-9 rounded-md border border-dp-border bg-dp-surface px-3 text-sm"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">{t("schedule.all_staff")}</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>{s.name_en || s.name_ar || s.name_he || s.id}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {isPending ? (
        <p className="text-sm text-dp-text-muted">Loading…</p>
      ) : view === "day" ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-dp-border">
              {appointments.length === 0 ? (
                <li className="px-4 py-8 text-center text-dp-text-muted text-sm">{t("schedule.no_appointments")}</li>
              ) : (
                appointments.map((a) => (
                  <li
                    key={a.id}
                    className="px-4 py-3 flex items-center justify-between gap-2 hover:bg-dp-surface-alt cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 text-dp-text-muted shrink-0" />
                      <span className="text-sm font-medium tabular-nums">
                        {new Date(a.start_at).toLocaleTimeString(locale === "ar" ? "ar" : locale === "he" ? "he" : "en", { hour: "2-digit", minute: "2-digit" })}
                        —{new Date(a.end_at).toLocaleTimeString(locale === "ar" ? "ar" : locale === "he" ? "he" : "en", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-sm text-dp-text-secondary truncate">
                        {a.customer_name || a.guest_name || "—"} · {a.service_names.join(", ") || "—"}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      a.status === "cancelled" ? "bg-dp-error-bg text-dp-error" : a.status === "no_show" ? "bg-dp-warning-bg text-dp-warning" : "bg-dp-surface-alt text-dp-text-secondary"
                    )}>
                      {a.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const d = new Date(startOfWeek(anchor));
            d.setDate(d.getDate() + i);
            const dayStr = toDateStr(d);
            const dayApts = groupedByDay[dayStr] ?? [];
            return (
              <Card key={dayStr}>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-dp-text-secondary mb-2">{dayStr}</p>
                  {dayApts.length === 0 ? (
                    <p className="text-sm text-dp-text-muted py-2">{t("schedule.no_appointments")}</p>
                  ) : (
                    <ul className="space-y-2">
                      {dayApts.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between py-2 border-b border-dp-border last:border-0 cursor-pointer hover:bg-dp-surface-alt -mx-2 px-2 rounded"
                          onClick={() => setSelected(a)}
                        >
                          <span className="text-sm tabular-nums">
                            {new Date(a.start_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            —{new Date(a.end_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-sm truncate">{a.customer_name || a.guest_name || "—"} · {a.service_names[0] ?? "—"}</span>
                          <span className="text-xs text-dp-text-muted">{a.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
            <div className="p-4 space-y-3">
              <p><User className="inline h-4 w-4 me-2" />{selected.customer_name || selected.guest_name || "—"}</p>
              <p className="text-sm text-dp-text-muted">{selected.service_names.join(", ")}</p>
              <p className="text-sm">{new Date(selected.start_at).toLocaleString(locale)} — {new Date(selected.end_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-xs text-dp-text-muted">₪{selected.total_price} · {selected.status}</p>
              {actionError && <p className="text-sm text-dp-error">{actionError}</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.status !== "cancelled" && selected.status !== "no_show" && (
                  <>
                    <Button variant="danger-ghost" size="sm" onClick={() => runAction("cancel")}>{t("actions.cancel")}</Button>
                    <Button variant="secondary" size="sm" onClick={() => runAction("no_show")}>{t("bookings.no_show")}</Button>
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
