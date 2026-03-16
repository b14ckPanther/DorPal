"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { DashboardStaff, StaffHourRow, BlockedSlotRow } from "@/lib/supabase/queries";
import { Users, Plus, Pencil, X, Clock, Ban } from "lucide-react";

const DAYS: { d: number; en: string; ar: string; he: string }[] = [
  { d: 0, en: "Sun", ar: "أحد", he: "א'" },
  { d: 1, en: "Mon", ar: "إثنين", he: "ב'" },
  { d: 2, en: "Tue", ar: "ثلاثاء", he: "ג'" },
  { d: 3, en: "Wed", ar: "أربعاء", he: "ד'" },
  { d: 4, en: "Thu", ar: "خميس", he: "ה'" },
  { d: 5, en: "Fri", ar: "جمعة", he: "ו'" },
  { d: 6, en: "Sat", ar: "سبت", he: "שבת" },
];

function dayLabel(d: number, locale: string) {
  const row = DAYS.find((x) => x.d === d);
  if (!row) return "";
  if (locale === "ar") return row.ar;
  if (locale === "he") return row.he;
  return row.en;
}

type Props = {
  locale: string;
  initialStaff: DashboardStaff[];
  isOwner: boolean;
  staffMemberId?: string | null;
};

export function DashboardStaffPage({ locale, initialStaff, isOwner, staffMemberId }: Props) {
  const t = useTranslations("dashboard");
  const [staff, setStaff] = useState<DashboardStaff[]>(initialStaff);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editing = editingId ? staff.find((s) => s.id === editingId) : null;

  const [form, setForm] = useState({
    name_ar: "",
    name_he: "",
    name_en: "",
    role_title_ar: "",
    role_title_he: "",
    role_title_en: "",
    photo_url: "",
    is_active: true,
    is_visible_in_booking: true,
    sort_order: 0,
    hours: [] as StaffHourRow[],
    blocked_slots: [] as { start_at: string; end_at: string; reason: string }[],
  });

  useEffect(() => {
    if (editing) {
      const byDay: Record<number, StaffHourRow> = {};
      for (let d = 0; d <= 6; d++) byDay[d] = { day_of_week: d, start_time: "09:00", end_time: "17:00" };
      for (const h of editing.hours ?? []) byDay[h.day_of_week] = h;
      setForm({
        name_ar: editing.name_ar ?? "",
        name_he: editing.name_he ?? "",
        name_en: editing.name_en,
        role_title_ar: editing.role_title_ar ?? "",
        role_title_he: editing.role_title_he ?? "",
        role_title_en: editing.role_title_en ?? "",
        photo_url: editing.photo_url ?? "",
        is_active: editing.is_active,
        is_visible_in_booking: editing.is_visible_in_booking,
        sort_order: editing.sort_order,
        hours: Object.values(byDay).sort((a, b) => a.day_of_week - b.day_of_week),
        blocked_slots: (editing.blocked_slots ?? []).map((b) => ({
          start_at: b.start_at.slice(0, 16),
          end_at: b.end_at.slice(0, 16),
          reason: b.reason ?? "",
        })),
      });
    } else {
      const hours = DAYS.map(({ d }) => ({ day_of_week: d, start_time: "09:00", end_time: "17:00" }));
      setForm({
        name_ar: "",
        name_he: "",
        name_en: "",
        role_title_ar: "",
        role_title_he: "",
        role_title_en: "",
        photo_url: "",
        is_active: true,
        is_visible_in_booking: true,
        sort_order: staff.length,
        hours,
        blocked_slots: [],
      });
    }
  }, [editing, editingId, staff.length]);

  function openAdd() {
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          const res = await fetch(`/api/dashboard/staff/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name_ar: form.name_ar || null,
              name_he: form.name_he || null,
              name_en: form.name_en,
              role_title_ar: form.role_title_ar || null,
              role_title_he: form.role_title_he || null,
              role_title_en: form.role_title_en || null,
              photo_url: form.photo_url || null,
              is_active: form.is_active,
              is_visible_in_booking: form.is_visible_in_booking,
              sort_order: form.sort_order,
              hours: form.hours,
              blocked_slots: form.blocked_slots.map((b) => ({
                start_at: new Date(b.start_at).toISOString(),
                end_at: new Date(b.end_at).toISOString(),
                reason: b.reason || null,
              })),
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message ?? "Failed to update");
          }
          const updated = await res.json();
          setStaff(updated);
        } else {
          const res = await fetch("/api/dashboard/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name_ar: form.name_ar || null,
              name_he: form.name_he || null,
              name_en: form.name_en,
              role_title_ar: form.role_title_ar || null,
              role_title_he: form.role_title_he || null,
              role_title_en: form.role_title_en || null,
              photo_url: form.photo_url || null,
              is_active: form.is_active,
              is_visible_in_booking: form.is_visible_in_booking,
              sort_order: form.sort_order,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message ?? "Failed to create");
          }
          const updated = await res.json();
          setStaff(updated);
        }
        closeDrawer();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleDeactivate(id: string) {
    if (!confirm(locale === "ar" ? "إلغاء تفعيل هذا الموظف؟" : locale === "he" ? "לבטל הפעלת חבר צוות זה?" : "Deactivate this staff member?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/dashboard/staff/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to deactivate");
        const updated = await res.json();
        setStaff(updated);
        closeDrawer();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function addBlockedSlot() {
    const from = new Date();
    from.setHours(9, 0, 0, 0);
    const to = new Date();
    to.setHours(17, 0, 0, 0);
    setForm((f) => ({
      ...f,
      blocked_slots: [...f.blocked_slots, { start_at: from.toISOString().slice(0, 16), end_at: to.toISOString().slice(0, 16), reason: "" }],
    }));
  }

  const displayName = (s: DashboardStaff) => s.name_en || s.name_ar || s.name_he || s.id;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dp-text-primary">{t("staff.title")}</h1>
          <p className="text-sm text-dp-text-muted mt-0.5">{t("staff.subtitle")}</p>
        </div>
        {isOwner && (
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("actions.add_staff")}
          </Button>
        )}
      </div>

      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-dp-text-muted mx-auto mb-3" />
            <p className="text-dp-text-secondary font-medium">{t("staff.no_staff")}</p>
            <p className="text-sm text-dp-text-muted mt-1">{t("staff.add_first")}</p>
            {isOwner && (
              <Button onClick={openAdd} className="mt-4">
                {t("actions.add_staff")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-dp-border">
              {staff.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-brand-iris/20 flex items-center justify-center text-brand-iris font-bold text-sm">
                        {(s.name_en || s.name_ar || "?")[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-dp-text-primary">{displayName(s)}</p>
                      <p className="text-xs text-dp-text-muted">
                        {s.role_title_en || s.role_title_ar || s.role_title_he || "—"}
                        {s.hours.length > 0 && ` · ${s.hours.length} ${t("staff.hours")}`}
                        {s.blocked_slots.length > 0 && ` · ${s.blocked_slots.length} ${t("staff.blocks")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!s.is_active && <span className="text-xs text-dp-text-muted">(inactive)</span>}
                    {(isOwner || staffMemberId === s.id) && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s.id)} title={t("staff.edit")}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {isOwner && s.is_active && (
                          <Button variant="danger-ghost" size="icon-sm" onClick={() => handleDeactivate(s.id)} title={t("staff.deactivate")}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDrawer} aria-hidden />
          <div
            className={cn(
              "fixed top-0 bottom-0 w-full max-w-lg bg-dp-surface border shadow-xl z-50 overflow-y-auto",
              locale === "ar" || locale === "he" ? "left-0 border-e" : "right-0 border-s"
            )}
            style={{ direction: locale === "ar" || locale === "he" ? "rtl" : "ltr" }}
          >
            <div className="p-4 border-b border-dp-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? t("staff.edit") : t("actions.add_staff")}
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={closeDrawer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">English name *</label>
                <Input value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">Arabic name</label>
                  <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">Hebrew name</label>
                  <Input value={form.name_he} onChange={(e) => setForm((f) => ({ ...f, name_he: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">{t("staff.role")} (EN)</label>
                <Input value={form.role_title_en} onChange={(e) => setForm((f) => ({ ...f, role_title_en: e.target.value }))} placeholder="e.g. Stylist" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">Photo URL</label>
                <Input value={form.photo_url} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))} />
              </div>
              {isOwner && (
                <>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                    <label htmlFor="active" className="text-sm">Active</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="visible" checked={form.is_visible_in_booking} onChange={(e) => setForm((f) => ({ ...f, is_visible_in_booking: e.target.checked }))} />
                    <label htmlFor="visible" className="text-sm">Visible in booking</label>
                  </div>
                </>
              )}

              {editingId && isOwner && (
                <>
                  <div className="pt-2 border-t border-dp-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-dp-text-muted" />
                      <span className="text-sm font-medium">{t("staff.hours")}</span>
                    </div>
                    <div className="space-y-2">
                      {form.hours.map((h, i) => (
                        <div key={h.day_of_week} className="flex items-center gap-2 text-sm">
                          <span className="w-16">{dayLabel(h.day_of_week, locale)}</span>
                          <Input type="time" value={h.start_time} onChange={(e) => setForm((f) => ({ ...f, hours: f.hours.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)) }))} className="flex-1" />
                          <Input type="time" value={h.end_time} onChange={(e) => setForm((f) => ({ ...f, hours: f.hours.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)) }))} className="flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-dp-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-dp-text-muted" />
                        <span className="text-sm font-medium">{t("staff.blocks")}</span>
                      </div>
                      <Button type="button" variant="ghost" size="xs" onClick={addBlockedSlot}>+ Add</Button>
                    </div>
                    <div className="space-y-2">
                      {form.blocked_slots.map((b, i) => (
                        <div key={i} className="flex flex-wrap gap-2 items-end">
                          <Input type="datetime-local" value={b.start_at} onChange={(e) => setForm((f) => ({ ...f, blocked_slots: f.blocked_slots.map((x, j) => (j === i ? { ...x, start_at: e.target.value } : x)) }))} className="flex-1 min-w-0" />
                          <Input type="datetime-local" value={b.end_at} onChange={(e) => setForm((f) => ({ ...f, blocked_slots: f.blocked_slots.map((x, j) => (j === i ? { ...x, end_at: e.target.value } : x)) }))} className="flex-1 min-w-0" />
                          <Input value={b.reason} onChange={(e) => setForm((f) => ({ ...f, blocked_slots: f.blocked_slots.map((x, j) => (j === i ? { ...x, reason: e.target.value } : x)) }))} placeholder="Reason" className="flex-1 min-w-0" />
                          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setForm((f) => ({ ...f, blocked_slots: f.blocked_slots.filter((_, j) => j !== i) }))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-dp-error">{error}</p>}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending}>
                  {editingId ? (locale === "ar" ? "حفظ" : locale === "he" ? "שמור" : "Save") : (locale === "ar" ? "إضافة" : locale === "he" ? "הוסף" : "Add")}
                </Button>
                <Button type="button" variant="secondary" onClick={closeDrawer}>
                  {t("actions.cancel")}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
