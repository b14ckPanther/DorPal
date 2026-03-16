"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { DashboardService, DashboardStaff } from "@/lib/supabase/queries";
import { Scissors, Plus, Pencil, X } from "lucide-react";

type Props = {
  locale: string;
  initialServices: DashboardService[];
  staffList: DashboardStaff[];
  isOwner: boolean;
};

export function DashboardServicesPage({ locale, initialServices, staffList, isOwner }: Props) {
  const t = useTranslations("dashboard");
  const [services, setServices] = useState<DashboardService[]>(initialServices);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editing = editingId ? services.find((s) => s.id === editingId) : null;

  const [form, setForm] = useState({
    name_ar: "",
    name_he: "",
    name_en: "",
    description_ar: "",
    description_he: "",
    description_en: "",
    duration_minutes: 30,
    price: 0,
    deposit_required: false,
    deposit_amount: 0,
    is_active: true,
    sort_order: 0,
    staff_ids: [] as string[],
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name_ar: editing.name_ar ?? "",
        name_he: editing.name_he ?? "",
        name_en: editing.name_en,
        description_ar: editing.description_ar ?? "",
        description_he: editing.description_he ?? "",
        description_en: editing.description_en ?? "",
        duration_minutes: editing.duration_minutes,
        price: editing.price,
        deposit_required: editing.deposit_required,
        deposit_amount: editing.deposit_amount ?? 0,
        is_active: editing.is_active,
        sort_order: editing.sort_order,
        staff_ids: editing.staff_ids ?? [],
      });
    } else {
      setForm({
        name_ar: "",
        name_he: "",
        name_en: "",
        description_ar: "",
        description_he: "",
        description_en: "",
        duration_minutes: 30,
        price: 0,
        deposit_required: false,
        deposit_amount: 0,
        is_active: true,
        sort_order: services.length,
        staff_ids: [],
      });
    }
  }, [editing, editingId, services.length]);

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
          const res = await fetch(`/api/dashboard/services/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name_ar: form.name_ar || null,
              name_he: form.name_he || null,
              name_en: form.name_en,
              description_ar: form.description_ar || null,
              description_he: form.description_he || null,
              description_en: form.description_en || null,
              duration_minutes: form.duration_minutes,
              price: form.price,
              deposit_required: form.deposit_required,
              deposit_amount: form.deposit_required ? form.deposit_amount : null,
              is_active: form.is_active,
              sort_order: form.sort_order,
              staff_ids: form.staff_ids,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message ?? "Failed to update");
          }
          const updated = await res.json();
          setServices(updated);
        } else {
          const res = await fetch("/api/dashboard/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name_ar: form.name_ar || null,
              name_he: form.name_he || null,
              name_en: form.name_en,
              description_ar: form.description_ar || null,
              description_he: form.description_he || null,
              description_en: form.description_en || null,
              duration_minutes: form.duration_minutes,
              price: form.price,
              deposit_required: form.deposit_required,
              deposit_amount: form.deposit_required ? form.deposit_amount : null,
              is_active: form.is_active,
              sort_order: form.sort_order,
              staff_ids: form.staff_ids,
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message ?? "Failed to create");
          }
          const updated = await res.json();
          setServices(updated);
        }
        closeDrawer();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  async function handleDeactivate(id: string) {
    if (!confirm(locale === "ar" ? "إلغاء تفعيل هذه الخدمة؟" : locale === "he" ? "לבטל הפעלת שירות זה?" : "Deactivate this service?")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/dashboard/services/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to deactivate");
        const updated = await res.json();
        setServices(updated);
        closeDrawer();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const displayName = (s: DashboardService) => s.name_en || s.name_ar || s.name_he || s.id;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dp-text-primary">{t("services.title")}</h1>
          <p className="text-sm text-dp-text-muted mt-0.5">{t("services.subtitle")}</p>
        </div>
        {isOwner && (
          <Button onClick={openAdd} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("actions.add_service")}
          </Button>
        )}
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scissors className="h-12 w-12 text-dp-text-muted mx-auto mb-3" />
            <p className="text-dp-text-secondary font-medium">{t("services.no_services")}</p>
            <p className="text-sm text-dp-text-muted mt-1">{t("services.add_first")}</p>
            {isOwner && (
              <Button onClick={openAdd} className="mt-4">
                {t("actions.add_service")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-dp-border">
              {services.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-dp-text-primary">{displayName(s)}</p>
                    <p className="text-xs text-dp-text-muted">
                      {s.duration_minutes} min · ₪{s.price}
                      {s.deposit_required && ` · ${t("services.deposit")} ₪${s.deposit_amount ?? 0}`}
                      {s.staff_ids.length > 0 && ` · ${s.staff_ids.length} ${t("services.staff_assigned")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!s.is_active && (
                      <span className="text-xs text-dp-text-muted">(inactive)</span>
                    )}
                    {isOwner && (
                      <>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s.id)} title={t("services.edit")}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {s.is_active && (
                          <Button variant="danger-ghost" size="icon-sm" onClick={() => handleDeactivate(s.id)} title={t("services.deactivate")}>
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

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDrawer} aria-hidden />
          <div
            className={cn(
              "fixed top-0 bottom-0 w-full max-w-md bg-dp-surface border shadow-xl z-50 overflow-y-auto",
              locale === "ar" || locale === "he" ? "left-0 border-e" : "right-0 border-s"
            )}
            style={{ direction: locale === "ar" || locale === "he" ? "rtl" : "ltr" }}
          >
            <div className="p-4 border-b border-dp-border flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? t("services.edit") : t("actions.add_service")}
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
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">Arabic name</label>
                <Input value={form.name_ar} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">Hebrew name</label>
                <Input value={form.name_he} onChange={(e) => setForm((f) => ({ ...f, name_he: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">{t("services.duration")}</label>
                  <Input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) || 30 }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">{t("services.price")} (₪)</label>
                  <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deposit"
                  checked={form.deposit_required}
                  onChange={(e) => setForm((f) => ({ ...f, deposit_required: e.target.checked }))}
                />
                <label htmlFor="deposit" className="text-sm">{t("services.deposit")}</label>
              </div>
              {form.deposit_required && (
                <div>
                  <label className="block text-sm font-medium text-dp-text-secondary mb-1">Amount (₪)</label>
                  <Input type="number" min={0} step={0.01} value={form.deposit_amount} onChange={(e) => setForm((f) => ({ ...f, deposit_amount: Number(e.target.value) || 0 }))} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <label htmlFor="active" className="text-sm">{t("services.active")}</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-dp-text-secondary mb-1">{t("services.staff_assigned")}</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-dp-border rounded-md p-2">
                  {staffList.map((st) => (
                    <label key={st.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.staff_ids.includes(st.id)}
                        onChange={(e) => {
                          if (e.target.checked) setForm((f) => ({ ...f, staff_ids: [...f.staff_ids, st.id] }));
                          else setForm((f) => ({ ...f, staff_ids: f.staff_ids.filter((id) => id !== st.id) }));
                        }}
                      />
                      <span>{st.name_en || st.name_ar || st.name_he || st.id}</span>
                    </label>
                  ))}
                  {staffList.length === 0 && <p className="text-xs text-dp-text-muted">No staff yet. Add staff first.</p>}
                </div>
              </div>
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
