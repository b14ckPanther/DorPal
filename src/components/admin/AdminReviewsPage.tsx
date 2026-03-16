"use client";

import { useState, useEffect } from "react";
import { Star, Eye, XCircle, EyeOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function AdminReviewsPage({ locale }: { locale: string }) {
  const t = useTranslations();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/reviews?${params}`)
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  const setStatus = async (id: string, status: string) => {
    setPending(true);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason: reason || undefined }),
    });
    setPending(false);
    if (res.ok) {
      setList((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setSelectedId(null);
      setReason("");
    }
  };

  const selected = list.find((r) => r.id === selectedId);
  const customerName = (row: Record<string, unknown>) => {
    const p = row.profiles as Record<string, unknown> | undefined;
    if (Array.isArray(p)) return (p[0] as Record<string, unknown>)?.full_name ?? "-";
    return (p?.full_name as string) ?? "-";
  };
  const bizName = (row: Record<string, unknown>) => {
    const b = row.businesses as Record<string, unknown> | undefined;
    if (Array.isArray(b)) return (b[0] as Record<string, unknown>)?.name_en ?? "-";
    return (b?.name_en as string) ?? "-";
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">Reviews moderation</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <select className="rounded-lg border border-dp-border bg-dp-surface px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="removed">Removed</option>
        </select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-dp-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-dp-text-muted">No reviews</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Business</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Customer</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Rating</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Status</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {list.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-dp-surface-alt/50">
                      <td className="px-4 py-3 text-sm">{bizName(row)}</td>
                      <td className="px-4 py-3 text-sm">{customerName(row)}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-0.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{String(row.rating)}</span></td>
                      <td className="px-4 py-3"><Badge size="sm">{String(row.status)}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(selectedId === row.id ? null : (row.id as string))}><Eye className="h-4 w-4" /></Button>
                          {row.status === "published" && (
                            <Button variant="ghost" size="xs" disabled={pending} onClick={() => setStatus(row.id as string, "hidden")} title="Hide">Hide</Button>
                          )}
                          {row.status !== "removed" && (
                            <Button variant="ghost" size="xs" className="text-dp-error" disabled={pending} onClick={() => setStatus(row.id as string, "removed")} title="Remove">Remove</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && selected && (
        <Card>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>Review — {bizName(selected)}</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)}><XCircle className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><strong>Rating:</strong> {String(selected.rating)}</p>
            <p><strong>Body:</strong> {locale === "ar" ? (selected.body_ar ?? selected.body_en) : (selected.body_en ?? selected.body_ar)}</p>
            <p><strong>Status:</strong> <Badge size="sm">{String(selected.status)}</Badge></p>
            <div>
              <label className="block text-sm mb-1">Reason (for moderation)</label>
              <input className="w-full rounded-md border border-dp-border px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason..." />
            </div>
            <div className="flex gap-2">
              {selected.status === "published" && (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus(selectedId, "hidden")}><EyeOff className="h-4 w-4" /> Hide</Button>
              )}
              {selected.status === "hidden" && (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus(selectedId, "published")}>Publish</Button>
              )}
              {selected.status !== "removed" && (
                <Button variant="danger" size="sm" disabled={pending} onClick={() => setStatus(selectedId, "removed")}><Trash2 className="h-4 w-4" /> Remove</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
