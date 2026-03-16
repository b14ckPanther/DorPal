"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search, Eye, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AdminBusinessesPage({ locale }: { locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [newNote, setNewNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/businesses?${params}`)
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q, statusFilter]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    fetch(`/api/admin/businesses/${selectedId}`)
      .then((r) => r.json())
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  const refreshDetail = () => selectedId && fetch(`/api/admin/businesses/${selectedId}`).then((r) => r.json()).then(setDetail);

  const setStatus = async (id: string, status: string) => {
    setPending(true);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending(false);
    if (res.ok) { refreshDetail(); router.refresh(); }
  };

  const addNote = async () => {
    if (!selectedId || !newNote.trim()) return;
    setPending(true);
    const res = await fetch(`/api/admin/businesses/${selectedId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newNote.trim() }),
    });
    setPending(false);
    if (res.ok) { setNewNote(""); refreshDetail(); }
  };

  const ownerName = (row: Record<string, unknown>) => {
    const p = row.profiles as Record<string, unknown> | undefined;
    if (Array.isArray(p)) return (p[0] as Record<string, unknown>)?.full_name ?? "-";
    return (p?.full_name as string) ?? "-";
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("admin.businesses.title")}</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dp-text-muted" />
          <Input className="pl-9" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="rounded-lg border border-dp-border bg-dp-surface px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_approval">Pending</option>
        </select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-dp-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-dp-text-muted">No businesses</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Business</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase hidden sm:table-cell">Owner</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Status</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {list.map((row, idx) => {
                    const typedRow = row as Record<string, unknown>;
                    const nameEn = String(typedRow.name_en ?? "");
                    const nameAr = String(typedRow.name_ar ?? "");
                    const slug = String(typedRow.slug ?? "");
                    const status = String(typedRow.status ?? "");
                    const id = String(typedRow.id ?? idx);
                    return (
                      <tr key={id} className="hover:bg-dp-surface-alt/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">
                            {locale === "ar" && nameAr ? nameAr : nameEn}
                          </p>
                          <p className="text-xs text-dp-text-muted">{slug}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {String(ownerName(typedRow))}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              status === "active"
                                ? "success"
                                : status === "suspended"
                                ? "error"
                                : "warning"
                            }
                            size="sm"
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setSelectedId(selectedId === id ? null : id)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && detail && (
        <Card>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>
              {locale === "ar"
                ? String(
                    (detail as Record<string, unknown>).name_ar ??
                      (detail as Record<string, unknown>).name_en ??
                      ""
                  )
                : String((detail as Record<string, unknown>).name_en ?? "")}{" "}
              — {String((detail as Record<string, unknown>).slug ?? "")}
            </CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)}><XCircle className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Status:</strong> <Badge size="sm">{String(detail.status)}</Badge></p>
            {detail.status === "active" && (
              <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus(selectedId, "suspended")}>{t("admin.businesses.suspend")}</Button>
            )}
            {detail.status === "suspended" && (
              <Button variant="outline" size="sm" disabled={pending} onClick={() => setStatus(selectedId, "active")}>{t("admin.businesses.activate")}</Button>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Internal notes</p>
              {(detail.admin_notes as Record<string, unknown>[])?.length > 0 && (
                <ul className="list-disc list-inside text-sm text-dp-text-secondary space-y-1 mb-2">
                  {(detail.admin_notes as { body?: string; created_at?: string }[]).map((n, i) => (
                    <li key={i}>{n.body} <span className="text-dp-text-muted">({n.created_at ? new Date(n.created_at).toLocaleString() : ""})</span></li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input className="flex-1 rounded-md border border-dp-border px-3 py-2 text-sm" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add note..." />
                <Button size="sm" disabled={pending || !newNote.trim()} onClick={addNote}>Add</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
