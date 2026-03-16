"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, X } from "lucide-react";
import type { DashboardOffer } from "@/lib/supabase/queries";

type Props = { locale: string; initialOffers: DashboardOffer[]; isOwner: boolean };

export function DashboardOffersPage({ locale, initialOffers, isOwner }: Props) {
  const t = useTranslations("dashboard");
  const [offers, setOffers] = useState<DashboardOffer[]>(initialOffers);
  const [drawer, setDrawer] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const editing = editId ? offers.find((o) => o.id === editId) : null;
  const [form, setForm] = useState({
    title_en: "",
    title_ar: "",
    title_he: "",
    description_en: "",
    discount_type: "percentage",
    discount_value: 10,
    start_at: "",
    end_at: "",
    status: "active",
    is_visible: true,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title_en: editing.title_en,
        title_ar: editing.title_ar ?? "",
        title_he: editing.title_he ?? "",
        description_en: editing.description_en ?? "",
        discount_type: editing.discount_type,
        discount_value: editing.discount_value,
        start_at: editing.start_at.slice(0, 16),
        end_at: editing.end_at.slice(0, 16),
        status: editing.status,
        is_visible: editing.is_visible,
      });
    } else {
      const now = new Date();
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      setForm({
        title_en: "",
        title_ar: "",
        title_he: "",
        description_en: "",
        discount_type: "percentage",
        discount_value: 10,
        start_at: now.toISOString().slice(0, 16),
        end_at: end.toISOString().slice(0, 16),
        status: "active",
        is_visible: true,
      });
    }
  }, [editing, editId]);

  const load = () => fetch("/api/dashboard/offers").then((r) => r.json()).then(setOffers);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      try {
        const body = {
          title_en: form.title_en,
          title_ar: form.title_ar || null,
          title_he: form.title_he || null,
          description_en: form.description_en || null,
          discount_type: form.discount_type,
          discount_value: form.discount_value,
          start_at: new Date(form.start_at).toISOString(),
          end_at: new Date(form.end_at).toISOString(),
          status: form.status,
          is_visible: form.is_visible,
        };
        const url = editId ? `/api/dashboard/offers/${editId}` : "/api/dashboard/offers";
        const res = await fetch(url, {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message ?? "Failed");
        }
        const data = await res.json();
        setOffers(data);
        setDrawer(false);
        setEditId(null);
      } catch (e) {
        setErr((e as Error).message);
      }
    });
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this offer?")) return;
    const res = await fetch(`/api/dashboard/offers/${id}`, { method: "DELETE" });
    if (res.ok) setOffers(await res.json());
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dp-text-primary">{t("offers.title")}</h1>
          <p className="text-sm text-dp-text-muted">{t("offers.subtitle")}</p>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => { setEditId(null); setDrawer(true); }}>
            <Plus className="h-4 w-4 me-2" />{t("offers.add")}
          </Button>
        )}
      </div>
      {offers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-dp-text-muted">{t("offers.no_offers")}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-dp-border">
              {offers.map((o) => (
                <li key={o.id} className="flex justify-between items-center px-4 py-3">
                  <div>
                    <p className="font-medium">{o.title_en}</p>
                    <p className="text-xs text-dp-text-muted">
                      {o.discount_type === "percentage" ? `${o.discount_value}%` : `₪${o.discount_value}`} · {o.status} · {new Date(o.end_at).toLocaleDateString(locale)}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => { setEditId(o.id); setDrawer(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      {o.status === "active" && <Button variant="danger-ghost" size="icon-sm" onClick={() => deactivate(o.id)}><X className="h-3.5 w-3.5" /></Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setDrawer(false); setEditId(null); }} />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-dp-surface border shadow-xl z-50 overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4">{editId ? t("services.edit") : t("offers.add")}</h2>
            <form onSubmit={save} className="space-y-3">
              <Input placeholder="Title (EN) *" value={form.title_en} onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))} required />
              <Input placeholder="Title (AR)" value={form.title_ar} onChange={(e) => setForm((f) => ({ ...f, title_ar: e.target.value }))} />
              <Input placeholder="Title (HE)" value={form.title_he} onChange={(e) => setForm((f) => ({ ...f, title_he: e.target.value }))} />
              <textarea className="w-full rounded-md border border-dp-border bg-dp-surface px-3 py-2 text-sm" rows={2} placeholder="Description" value={form.description_en} onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))} />
              <select className="w-full h-10 rounded-md border border-dp-border px-3 text-sm" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}>
                <option value="percentage">{t("offers.percentage")}</option>
                <option value="fixed">{t("offers.fixed")}</option>
              </select>
              <Input type="number" min={0} step={0.01} value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) || 0 }))} />
              <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} required />
              <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} required />
              {err && <p className="text-sm text-dp-error">{err}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>Save</Button>
                <Button type="button" variant="secondary" onClick={() => { setDrawer(false); setEditId(null); }}>Cancel</Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
