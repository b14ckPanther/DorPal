"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function AdminSubscriptionsPage() {
  const t = useTranslations();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlanId, setNewPlanId] = useState("");
  const [newTrialEnds, setNewTrialEnds] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/plans").then((r) => r.json()).then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const saveEdit = async () => {
    if (!editingId) return;
    setPending(true);
    const body: Record<string, string> = {};
    if (newPlanId) body.plan_id = newPlanId;
    if (newTrialEnds) body.trial_ends_at = newTrialEnds;
    if (newStatus) body.status = newStatus;
    const res = await fetch(`/api/admin/subscriptions/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (res.ok) {
      const updated = await res.json();
      setList((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...updated } : s)));
      setEditingId(null);
      setNewPlanId("");
      setNewTrialEnds("");
      setNewStatus("");
    }
  };

  const planName = (row: Record<string, unknown>) => {
    const p = row.subscription_plans as Record<string, unknown> | undefined;
    if (Array.isArray(p)) return (p[0] as Record<string, unknown>)?.name_en ?? "-";
    return (p?.name_en as string) ?? "-";
  };
  const bizName = (row: Record<string, unknown>) => {
    const b = row.businesses as Record<string, unknown> | undefined;
    if (Array.isArray(b)) return (b[0] as Record<string, unknown>)?.name_en ?? "-";
    return (b?.name_en as string) ?? "-";
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("admin.nav.subscriptions")}</h1>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-dp-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-dp-text-muted">No subscriptions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Business</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Plan</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Status</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Trial ends</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {list.map((row, idx) => {
                    const typedRow = row as Record<string, unknown>;
                    const id = String(typedRow.id ?? idx);
                    const status = String(typedRow.status ?? "");
                    const trialEnds = typedRow.trial_ends_at
                      ? new Date(String(typedRow.trial_ends_at)).toLocaleDateString()
                      : "-";
                    return (
                    <tr key={id} className="hover:bg-dp-surface-alt/50">
                      <td className="px-4 py-3 text-sm">{String(bizName(typedRow))}</td>
                      <td className="px-4 py-3 text-sm">{String(planName(typedRow))}</td>
                      <td className="px-4 py-3"><Badge size="sm">{status}</Badge></td>
                      <td className="px-4 py-3 text-sm">{trialEnds}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="xs" disabled={pending} onClick={() => { setEditingId(editingId === id ? null : id); setNewPlanId(""); setNewTrialEnds(""); setNewStatus(""); }}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingId && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="font-medium">Override subscription</p>
            <div>
              <label className="block text-xs text-dp-text-muted mb-1">Plan</label>
              <select className="w-full rounded-md border border-dp-border px-3 py-2 text-sm" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}>
                <option value="">— Keep —</option>
                {plans.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>{String(p.name_en)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-dp-text-muted mb-1">Trial ends (YYYY-MM-DD)</label>
              <input type="date" className="w-full rounded-md border border-dp-border px-3 py-2 text-sm" value={newTrialEnds} onChange={(e) => setNewTrialEnds(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-dp-text-muted mb-1">Status</label>
              <select className="w-full rounded-md border border-dp-border px-3 py-2 text-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">— Keep —</option>
                <option value="trialing">Trialing</option>
                <option value="active">Active</option>
                <option value="past_due">Past due</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={pending || (!newPlanId && !newTrialEnds && !newStatus)} onClick={saveEdit}>Save</Button>
              <Button variant="secondary" size="sm" onClick={() => { setEditingId(null); setNewPlanId(""); setNewTrialEnds(""); setNewStatus(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
