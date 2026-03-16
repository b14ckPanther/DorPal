"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";

export function AdminAuditPage() {
  const t = useTranslations();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityType, setEntityType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (actionFilter) params.set("action", actionFilter);
    if (entityType) params.set("entity_type", entityType);
    setLoading(true);
    fetch(`/api/admin/audit?${params}`)
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [from, to, actionFilter, entityType]);

  const actorName = (row: Record<string, unknown>) => {
    const p = row.profiles as Record<string, unknown> | undefined;
    if (Array.isArray(p)) return (p[0] as Record<string, unknown>)?.full_name ?? row.actor_id ?? "-";
    return (p?.full_name as string) ?? String(row.actor_id ?? "-");
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("admin.nav.audit")}</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-dp-text-muted mb-1">From</label>
          <input type="date" className="rounded-lg border border-dp-border px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-dp-text-muted mb-1">To</label>
          <input type="date" className="rounded-lg border border-dp-border px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-dp-text-muted mb-1">Action</label>
          <input className="rounded-lg border border-dp-border px-3 py-2 text-sm w-40" placeholder="e.g. business_application_approved" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-dp-text-muted mb-1">Entity type</label>
          <input className="rounded-lg border border-dp-border px-3 py-2 text-sm w-32" placeholder="e.g. business" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-dp-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-dp-text-muted">No audit entries</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Time</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Actor</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Action</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Entity</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {list.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-dp-surface-alt/50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{row.created_at ? new Date(String(row.created_at)).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-sm">{actorName(row)}</td>
                      <td className="px-4 py-3 text-sm font-mono">{String(row.action)}</td>
                      <td className="px-4 py-3 text-sm">{String(row.entity_type)} / {String(row.entity_id).slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-xs text-dp-text-muted max-w-[200px] truncate">{row.payload ? JSON.stringify(row.payload) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
