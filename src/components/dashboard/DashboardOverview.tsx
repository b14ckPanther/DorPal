"use client";

import {
  CalendarCheck, TrendingUp, Star, Users, ArrowUpRight,
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  locale: string;
}

const STATS = [
  {
    key: "today_bookings",
    value: "8",
    change: "+2",
    positive: true,
    icon: CalendarCheck,
    color: "text-brand-iris",
    bg: "bg-brand-iris/10",
  },
  {
    key: "revenue",
    value: "₪1,240",
    change: "+18%",
    positive: true,
    icon: TrendingUp,
    color: "text-dp-success",
    bg: "bg-dp-success-bg",
  },
  {
    key: "rating",
    value: "4.9",
    change: "+0.1",
    positive: true,
    icon: Star,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    key: "new_reviews",
    value: "3",
    change: "اليوم",
    positive: null,
    icon: Users,
    color: "text-brand-plum",
    bg: "bg-brand-plum/10",
  },
];

const CHART_DATA = [
  { day: "الأحد", bookings: 4, revenue: 320 },
  { day: "الاثنين", bookings: 7, revenue: 580 },
  { day: "الثلاثاء", bookings: 5, revenue: 420 },
  { day: "الأربعاء", bookings: 9, revenue: 760 },
  { day: "الخميس", bookings: 8, revenue: 640 },
  { day: "الجمعة", bookings: 6, revenue: 480 },
  { day: "السبت", bookings: 3, revenue: 240 },
];

const TODAY_BOOKINGS = [
  {
    id: "1",
    customer: "أحمد الزبيدي",
    service: "حلاقة كلاسيكية",
    time: "10:00",
    staff: "محمد",
    status: "confirmed",
    price: 45,
  },
  {
    id: "2",
    customer: "عمر سمعان",
    service: "حلاقة + لحية",
    time: "11:00",
    staff: "أحمد",
    status: "confirmed",
    price: 70,
  },
  {
    id: "3",
    customer: "يوسف نصر",
    service: "تهذيب اللحية",
    time: "11:30",
    staff: "محمد",
    status: "pending",
    price: 35,
  },
  {
    id: "4",
    customer: "خالد ابراهيم",
    service: "حلاقة كلاسيكية",
    time: "14:00",
    staff: "خالد",
    status: "cancelled",
    price: 45,
  },
];

const STATUS_CONFIG = {
  confirmed: { icon: CheckCircle2, color: "text-dp-success", bg: "bg-dp-success-bg", label: "مؤكد" },
  pending: { icon: AlertCircle, color: "text-dp-warning", bg: "bg-dp-warning-bg", label: "قيد الانتظار" },
  cancelled: { icon: XCircle, color: "text-dp-error", bg: "bg-dp-error-bg", label: "ملغي" },
};

export function DashboardOverview({ locale }: DashboardOverviewProps) {
  const t = useTranslations();
  const { profile } = useAuth();

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
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                {stat.positive !== null && (
                  <span className={cn(
                    "text-xs font-medium",
                    stat.positive ? "text-dp-success" : "text-dp-error"
                  )}>
                    {stat.change}
                    {stat.positive && <ArrowUpRight className="inline h-3 w-3" />}
                  </span>
                )}
                {stat.positive === null && (
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
              <CardTitle>{locale === "ar" ? "الحجوزات هذا الأسبوع" : locale === "he" ? "הזמנות השבוע" : "This Week's Bookings"}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${locale}/dashboard/analytics`}>
                  {t("common.see_all")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={CHART_DATA}>
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
              {locale === "ar" ? "إجراءات سريعة" : locale === "he" ? "פעולות מהירות" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: locale === "ar" ? "إضافة حجز" : locale === "he" ? "הוסף הזמנה" : "Add Booking", path: "/bookings/new", icon: CalendarCheck, color: "text-brand-iris" },
              { label: locale === "ar" ? "إضافة خدمة" : locale === "he" ? "הוסף שירות" : "Add Service", path: "/services", icon: Calendar, color: "text-brand-plum" },
              { label: locale === "ar" ? "إضافة عرض" : locale === "he" ? "הוסף מבצע" : "Add Offer", path: "/offers", icon: Clock, color: "text-dp-warning" },
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
            {TODAY_BOOKINGS.map((booking) => {
              const status = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = status.icon;
              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 rounded-card-sm border border-dp-border hover:bg-dp-surface-alt transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-brand-iris/10 flex items-center justify-center shrink-0">
                    <span className="text-brand-iris font-bold text-sm">
                      {booking.customer[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dp-text-primary truncate">
                      {booking.customer}
                    </p>
                    <p className="text-xs text-dp-text-muted">
                      {booking.service} · {booking.staff}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-end hidden sm:block">
                      <p className="text-xs font-medium text-dp-text-secondary num">{booking.time}</p>
                      <p className="text-xs text-dp-text-muted num">₪{booking.price}</p>
                    </div>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.bg, status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="hidden sm:block">{status.label}</span>
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
