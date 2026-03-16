"use client";

import { useState, useEffect } from "react";
import { Search, Eye, XCircle, Key } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AdminUsersPage({ locale }: { locale: string }) {
  const t = useTranslations();
  const [list, setList] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [newNote, setNewNote] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setList(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    fetch(`/api/admin/users/${selectedId}`)
      .then((r) => r.json())
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  const refreshDetail = () => selectedId && fetch(`/api/admin/users/${selectedId}`).then((r) => r.json()).then(setDetail);

  const doResetPassword = async () => {
    if (!selectedId || !resetPassword.trim()) return;
    setPending(true);
    const res = await fetch(`/api/admin/users/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_password", password: resetPassword }),
    });
    setPending(false);
    if (res.ok) setResetPassword("");
  };

  const addNote = async () => {
    if (!selectedId || !newNote.trim()) return;
    setPending(true);
    const res = await fetch(`/api/admin/users/${selectedId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newNote.trim() }),
    });
    setPending(false);
    if (res.ok) { setNewNote(""); refreshDetail(); }
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">{t("admin.users.title")}</h1>
      </div>
      <div className="flex flex-wrap gap-3">
        <select className="rounded-lg border border-dp-border bg-dp-surface px-3 py-2 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="business_owner">Business owner</option>
          <option value="staff">Staff</option>
          <option value="super_admin">Super admin</option>
        </select>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-dp-text-muted">Loading...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-dp-text-muted">No users</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Name</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Email</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Role</th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {list.map((row) => (
                    <tr key={String(row.id)} className="hover:bg-dp-surface-alt/50">
                      <td className="px-4 py-3 font-medium text-sm">{String(row.full_name ?? "-")}</td>
                      <td className="px-4 py-3 text-sm">{String(row.email ?? "-")}</td>
                      <td className="px-4 py-3"><Badge size="sm">{String(row.role)}</Badge></td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(selectedId === row.id ? null : (row.id as string))}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && detail && (
        <Card>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>{String(detail.full_name ?? detail.email)}</CardTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setSelectedId(null)}><XCircle className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Email:</strong> {String(detail.email)}</p>
            <p><strong>Role:</strong> <Badge size="sm">{String(detail.role)}</Badge></p>
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1"><Key className="h-4 w-4" /> Reset password</p>
              <div className="flex gap-2">
                <Input type="password" className="flex-1" placeholder="New password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                <Button size="sm" disabled={pending || !resetPassword.trim()} onClick={doResetPassword}>Set</Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Internal notes</p>
              {(detail.admin_notes as { body?: string; created_at?: string }[])?.length > 0 && (
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
