"use client";

import {
  CalendarCheck, TrendingUp, Star, Users, ArrowUpRight,
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BookingListItem } from "@/lib/supabase/queries";

interface DashboardOverviewProps {
  locale: string;
}

const STATUS_CONFIG = {
  confirmed: { icon: CheckCircle2, color: "text-dp-success", bg: "bg-dp-success-bg" },
  pending: { icon: AlertCircle, color: "text-dp-warning", bg: "bg-dp-warning-bg" },
  cancelled: { icon: XCircle, color: "text-dp-error", bg: "bg-dp-error-bg" },
  completed: { icon: CheckCircle2, color: "text-dp-success", bg: "bg-dp-success-bg" },
  checked_in: { icon: CheckCircle2, color: "text-dp-success", bg: "bg-dp-success-bg" },
  in_progress: { icon: CheckCircle2, color: "text-dp-success", bg: "bg-dp-success-bg" },
  no_show: { icon: XCircle, color: "text-dp-error", bg: "bg-dp-error-bg" },
};

export function DashboardOverview({ locale }: DashboardOverviewProps) {
  const t = useTranslations();
  const { profile } = useAuth();
  const [todayBookings, setTodayBookings] = useState<BookingListItem[]>([]);
  const [weekBookings, setWeekBookings] = useState<BookingListItem[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [reviewsAvg, setReviewsAvg] = useState(0);
  const [newReviewsToday, setNewReviewsToday] = useState(0);

  const localeCode = locale === "ar" ? "ar" : locale === "he" ? "he" : "en";

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - now.getDay());
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    const weekStart = weekStartDate.toISOString().slice(0, 10);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    void (async () => {
      const [todayRes, weekRes, analyticsRes, reviewsRes] = await Promise.all([
        fetch(`/api/dashboard/bookings?from=${today}&to=${today}`),
        fetch(`/api/dashboard/bookings?from=${weekStart}&to=${weekEnd}`),
        fetch(`/api/dashboard/analytics?from=${monthStart}&to=${today}`),
        fetch("/api/dashboard/reviews"),
      ]);

      if (todayRes.ok) {
        const data = (await todayRes.json()) as BookingListItem[];
        setTodayBookings((data ?? []).sort((a, b) => a.start_at.localeCompare(b.start_at)));
      }
      if (weekRes.ok) {
        const data = (await weekRes.json()) as BookingListItem[];
        setWeekBookings(data ?? []);
      }
      if (analyticsRes.ok) {
        const data = (await analyticsRes.json()) as { revenue?: number };
        setMonthRevenue(Number(data?.revenue ?? 0));
      }
      if (reviewsRes.ok) {
        const reviews = (await reviewsRes.json()) as { rating: number; created_at: string }[];
        const list = reviews ?? [];
        const avg = list.length > 0
          ? list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / list.length
          : 0;
        const todayCount = list.filter((r) => r.created_at.slice(0, 10) === today).length;
        setReviewsAvg(avg);
        setNewReviewsToday(todayCount);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    const now = new Date();
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - now.getDay());
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const count = weekBookings.filter(
        (b) => b.start_at.slice(0, 10) === iso && b.status !== "cancelled"
      ).length;
      return {
        day: d.toLocaleDateString(localeCode, { weekday: "short" }),
        bookings: count,
      };
    });
    return days;
  }, [localeCode, weekBookings]);

  const formattedRevenue = new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(monthRevenue);

  const stats = [
    {
      key: "today_bookings",
      value: String(todayBookings.filter((b) => b.status !== "cancelled").length),
      change: t("common.today"),
      positive: null,
      icon: CalendarCheck,
      color: "text-brand-iris",
      bg: "bg-brand-iris/10",
    },
    {
      key: "revenue",
      value: formattedRevenue,
      change: null,
      positive: null,
      icon: TrendingUp,
      color: "text-dp-success",
      bg: "bg-dp-success-bg",
    },
    {
      key: "rating",
      value: reviewsAvg > 0 ? reviewsAvg.toFixed(1) : "—",
      change: null,
      positive: null,
      icon: Star,
      color: "text-yellow-500",
      bg: "bg-yellow-50",
    },
    {
      key: "new_reviews",
      value: String(newReviewsToday),
      change: t("common.today"),
      positive: null,
      icon: Users,
      color: "text-brand-plum",
      bg: "bg-brand-plum/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-dp-text-primary">
          {t("dashboard.welcome", { name: profile?.full_name?.split(" ")[0] ?? t("common.friend") })}
        </h1>
        <p className="text-dp-text-muted text-sm mt-0.5">
          {new Date().toLocaleDateString(locale === "ar" ? "ar" : locale === "he" ? "he" : "en", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                {stat.positive !== null && stat.change && (
                  <span className={cn(
                    "text-xs font-medium",
                    stat.positive ? "text-dp-success" : "text-dp-error"
                  )}>
                    {stat.change}
                    {stat.positive && <ArrowUpRight className="inline h-3 w-3" />}
                  </span>
                )}
                {stat.positive === null && stat.change && (
                  <span className="text-xs text-dp-text-muted">{stat.change}</span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-dp-text-primary num">{stat.value}</p>
                <p className="text-xs text-dp-text-muted mt-0.5">
                  {t(`dashboard.overview.${stat.key}`)}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("dashboard.overview.week_bookings_title")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/dashboard/analytics`}>
                  {t("common.see_all")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8DFF0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8A8198" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8198" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E8DFF0", boxShadow: "0 4px 6px -1px rgba(31,22,48,0.06)" }}
                  labelStyle={{ color: "#1F1630", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#7C5CFF"
                  strokeWidth={2.5}
                  fill="url(#bookingsGrad)"
                  dot={{ fill: "#7C5CFF", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("dashboard.overview.quick_actions_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: t("dashboard.overview.add_booking"), path: "/bookings/new", icon: CalendarCheck, color: "text-brand-iris" },
              { label: t("dashboard.actions.add_service"), path: "/services", icon: Calendar, color: "text-brand-plum" },
              { label: t("dashboard.overview.add_offer"), path: "/offers", icon: Clock, color: "text-dp-warning" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  href={`/${locale}/dashboard${action.path}`}
                  className="flex items-center gap-3 p-3 rounded-card-sm border border-dp-border hover:border-brand-iris/30 hover:bg-brand-iris/5 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-dp-surface-alt flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                    <Icon className={cn("h-4 w-4", action.color)} />
                  </div>
                  <span className="text-sm text-dp-text-secondary group-hover:text-dp-text-primary">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Today's bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("dashboard.overview.today_bookings")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/dashboard/bookings`}>
                {t("common.see_all")}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayBookings.length === 0 && (
              <p className="text-sm text-dp-text-muted">{t("dashboard.bookings.no_bookings")}</p>
            )}
            {todayBookings.slice(0, 6).map((booking) => {
              const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
              if (!status) return null;
              const StatusIcon = status.icon;
              const customerName = booking.customer_name || booking.guest_name || "—";
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-card-sm border border-dp-border hover:bg-dp-surface-alt transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-brand-iris/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-iris font-bold text-sm">
                      {customerName[0] ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dp-text-primary truncate">
                      {customerName}
                    </p>
                    <p className="text-xs text-dp-text-muted">
                      {(booking.service_names[0] ?? "—")} · {(booking.staff_name ?? "—")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end hidden sm:block">
                      <p className="text-xs font-medium text-dp-text-secondary num">
                        {new Date(booking.start_at).toLocaleTimeString(localeCode, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-dp-text-muted num">
                        {new Intl.NumberFormat(localeCode, {
                          style: "currency",
                          currency: "ILS",
                          maximumFractionDigits: 0,
                        }).format(booking.total_price)}
                      </p>
                    </div>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.bg, status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="hidden sm:block">{t(`dashboard.status.${booking.status}`)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
