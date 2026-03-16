"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Clock, Eye,
  Building2, Mail, Phone, MapPin, Scissors, Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ApplicationItem } from "@/lib/supabase/queries";

interface AdminApplicationsPageProps {
  locale: string;
  applications: ApplicationItem[];
}

const STATUS_CONFIG = {
  pending: { variant: "warning" as const, icon: Clock },
  approved: { variant: "success" as const, icon: CheckCircle2 },
  rejected: { variant: "error" as const, icon: XCircle },
};

export function AdminApplicationsPage({ locale, applications }: AdminApplicationsPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const approve = (appId: string) => {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch(`/api/admin/applications/${appId}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "error", text: data.message ?? "Failed" });
        return;
      }
      setMsg({ type: "success", text: data.credentials ? `Credentials: ${data.credentials.email} / ${data.credentials.password}` : "Approved" });
      setSelected(null);
      router.refresh();
    });
  };

  const reject = (appId: string) => {
    startTransition(async () => {
      setMsg(null);
      const res = await fetch(`/api/admin/applications/${appId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg({ type: "error", text: d.message ?? "Failed" });
        return;
      }
      setMsg({ type: "success", text: "Rejected" });
      setRejectId(null);
      setRejectReason("");
      setSelected(null);
      router.refresh();
    });
  };

  const filtered = applications.filter(
    (a) => filter === "all" || a.status === filter
  );

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const getBizName = (app: ApplicationItem) =>
    locale === "ar" ? (app.business_name_ar ?? app.business_name_en) : app.business_name_en;

  const getCategoryName = (app: ApplicationItem) =>
    locale === "ar" ? app.category_name_ar : app.category_name_en;

  const getLocalityName = (app: ApplicationItem) =>
    locale === "ar" ? app.locality_name_ar : app.locality_name_en;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dp-text-primary">
            {t("admin.applications.title")}
          </h1>
          <p className="text-dp-text-muted text-sm mt-0.5">
            {counts.pending}{" "}
            {locale === "ar" ? "طلب ينتظر المراجعة" : locale === "he" ? "בקשות ממתינות" : "applications pending review"}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "p-4 rounded-card border text-start transition-all",
              filter === status
                ? "border-brand-iris bg-brand-iris/5 shadow-raised"
                : "border-dp-border bg-dp-surface hover:border-brand-iris/30"
            )}
          >
            <p className={cn(
              "text-2xl font-bold num mb-1",
              filter === status ? "text-brand-iris" : "text-dp-text-primary"
            )}>
              {counts[status]}
            </p>
            <p className="text-xs text-dp-text-muted capitalize">
              {status === "all"
                ? (locale === "ar" ? "الكل" : locale === "he" ? "הכל" : "All")
                : t(`admin.applications.${status}`)}
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-dp-text-muted">
              {locale === "ar" ? "لا توجد طلبات" : locale === "he" ? "אין בקשות" : "No applications"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dp-border bg-dp-surface-alt">
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase tracking-wide">
                      {locale === "ar" ? "المتقدم" : locale === "he" ? "מגיש" : "Applicant"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase tracking-wide hidden sm:table-cell">
                      {locale === "ar" ? "العمل" : locale === "he" ? "עסק" : "Business"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase tracking-wide hidden md:table-cell">
                      {locale === "ar" ? "الموقع" : locale === "he" ? "מיקום" : "Location"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase tracking-wide">
                      {locale === "ar" ? "الحالة" : locale === "he" ? "סטטוס" : "Status"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold text-dp-text-muted uppercase tracking-wide">
                      {locale === "ar" ? "الإجراءات" : locale === "he" ? "פעולות" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dp-border">
                  {filtered.map((app) => {
                    const statusCfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={app.id} className="hover:bg-dp-surface-alt/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm text-dp-text-primary">
                              {app.applicant_name}
                            </p>
                            <p className="text-xs text-dp-text-muted">{app.applicant_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div>
                            <p className="text-sm font-medium text-dp-text-primary">
                              {getBizName(app)}
                            </p>
                            <p className="text-xs text-dp-text-muted">{getCategoryName(app)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-dp-text-secondary">{getLocalityName(app)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusCfg.variant} size="sm" className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {t(`common.${app.status}`)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {app.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-dp-success hover:bg-dp-success-bg gap-1"
                                  disabled={pending}
                                  onClick={() => approve(app.id)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {t("admin.applications.approve")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-dp-error hover:bg-dp-error-bg gap-1"
                                  disabled={pending}
                                  onClick={() => setRejectId(app.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {t("admin.applications.reject")}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-dp-text-muted hover:text-dp-text-primary"
                              onClick={() => setSelected(app.id === selected ? null : app.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Detail drawer */}
      {selected && (() => {
        const app = applications.find((a) => a.id === selected);
        if (!app) return null;
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {locale === "ar" ? "تفاصيل الطلب" : locale === "he" ? "פרטי הבקשה" : "Application Details"}
                </CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: locale === "ar" ? "اسم العمل" : "Business", value: getBizName(app) },
                  { icon: Scissors, label: locale === "ar" ? "الفئة" : "Category", value: getCategoryName(app) },
                  { icon: Mail, label: locale === "ar" ? "البريد" : "Email", value: app.applicant_email },
                  { icon: Phone, label: locale === "ar" ? "الهاتف" : "Phone", value: app.applicant_phone ?? "-" },
                  { icon: MapPin, label: locale === "ar" ? "الموقع" : "Location", value: `${getLocalityName(app)}${app.address ? ` - ${app.address}` : ""}` },
                  { icon: Calendar, label: locale === "ar" ? "التاريخ" : "Date", value: new Date(app.submitted_at).toLocaleDateString() },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-dp-surface-alt rounded-card-sm">
                    <Icon className="h-4 w-4 text-brand-iris shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-dp-text-muted">{label}</p>
                      <p className="text-sm font-medium text-dp-text-primary">{value}</p>
                    </div>
                  </div>
                ))}
                {app.description_en && (
                  <div className="sm:col-span-2 p-3 bg-dp-surface-alt rounded-card-sm">
                    <p className="text-xs text-dp-text-muted mb-1">
                      {locale === "ar" ? "رسالة المتقدم" : "Description"}
                    </p>
                    <p className="text-sm text-dp-text-secondary">{app.description_en}</p>
                  </div>
                )}
              </div>

              {app.status === "pending" && (
                <div className="flex gap-3 mt-4">
                  <Button variant="primary" className="gap-2 flex-1" disabled={pending} onClick={() => approve(app.id)}>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("admin.applications.approve")}
                  </Button>
                  <Button variant="danger" className="gap-2 flex-1" disabled={pending} onClick={() => setRejectId(app.id)}>
                    <XCircle className="h-4 w-4" />
                    {t("admin.applications.reject")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {msg && (
        <div className={cn("p-3 rounded-lg text-sm", msg.type === "success" ? "bg-dp-success-bg text-dp-success" : "bg-dp-error-bg text-dp-error")}>
          {msg.text}
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>{t("admin.applications.reject")}</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => { setRejectId(null); setRejectReason(""); }}><XCircle className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm">Reason (optional)</label>
              <textarea className="w-full rounded-md border border-dp-border p-2 text-sm" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason..." />
              <div className="flex gap-2">
                <Button variant="danger" disabled={pending} onClick={() => reject(rejectId)}>Reject</Button>
                <Button variant="secondary" onClick={() => { setRejectId(null); setRejectReason(""); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
