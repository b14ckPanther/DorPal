"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, User, Scissors, Users, Calendar, CalendarCheck,
  Tag, Star, BarChart3, CreditCard, Settings, LogOut,
  Menu, X, ChevronRight, ChevronLeft, ExternalLink, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

interface DashboardShellProps {
  locale: string;
  businessName?: string | null;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, key: "overview", path: "" },
  { icon: User, key: "profile", path: "/profile" },
  { icon: Scissors, key: "services", path: "/services" },
  { icon: Users, key: "staff", path: "/staff" },
  { icon: Calendar, key: "schedule", path: "/schedule" },
  { icon: CalendarCheck, key: "bookings", path: "/bookings" },
  { icon: Tag, key: "offers", path: "/offers" },
  { icon: Star, key: "reviews", path: "/reviews" },
  { icon: BarChart3, key: "analytics", path: "/analytics" },
  { icon: CreditCard, key: "subscription", path: "/subscription" },
  { icon: Settings, key: "settings", path: "/settings" },
];

export function DashboardShell({ locale, businessName, children }: DashboardShellProps) {
  const t = useTranslations();
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isRTL = locale !== "en";
  const CollapseIcon = isRTL
    ? collapsed ? ChevronLeft : ChevronRight
    : collapsed ? ChevronRight : ChevronLeft;

  function getPath(path: string) {
    return `/${locale}/dashboard${path}`;
  }

  function isActive(path: string) {
    const full = getPath(path);
    if (path === "") return pathname === full;
    return pathname.startsWith(full);
  }

  const displayName =
    businessName?.trim() ||
    profile?.full_name?.trim() ||
    (locale === "ar" ? "العمل الخاص بك" : locale === "he" ? "העסק שלך" : "Your business");

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-dp-border">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/logo.png"
            alt="DorPal"
            width={100}
            height={32}
            className="h-8 w-auto max-w-[100px] object-contain shrink-0 bg-transparent"
            unoptimized
            style={{ background: "transparent" }}
          />
          {!collapsed && (
            <span className="font-bold text-dp-text-primary truncate sr-only">
              DorPal
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            className="hidden lg:flex h-7 w-7 rounded-full border border-dp-border items-center justify-center hover:bg-dp-surface-alt transition-colors shrink-0"
            onClick={() => setCollapsed(true)}
          >
            <CollapseIcon className="h-3.5 w-3.5 text-dp-text-muted" />
          </button>
        )}
      </div>

      {/* Business info */}
      {!collapsed && (
        <div className="p-4 border-b border-dp-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-iris flex items-center justify-center text-white font-bold text-sm shrink-0">
              {displayName[0]?.toUpperCase() ?? "B"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dp-text-primary truncate">
                {displayName}
              </p>
              <p className="text-xs text-dp-text-muted capitalize">
                {profile?.role ?? "owner"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, key, path }) => (
          <Link
            key={key}
            href={getPath(path)}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-card-sm text-sm transition-all",
              isActive(path)
                ? "bg-brand-iris/10 text-brand-iris font-medium"
                : "text-dp-text-secondary hover:bg-dp-surface-alt hover:text-dp-text-primary",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? t(`dashboard.nav.${key}`) : undefined}
          >
            <Icon
              className={cn(
                "h-4.5 w-4.5 shrink-0",
                isActive(path) ? "text-brand-iris" : "text-current"
              )}
            />
            {!collapsed && (
              <span className="truncate">{t(`dashboard.nav.${key}`)}</span>
            )}
            {!collapsed && isActive(path) && (
              <div className="ms-auto h-1.5 w-1.5 rounded-full bg-brand-iris" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-dp-border space-y-1">
        {collapsed ? (
          <button
            className="w-full flex items-center justify-center p-2.5 text-dp-text-muted hover:text-dp-text-primary hover:bg-dp-surface-alt rounded-card-sm transition-colors"
            onClick={() => setCollapsed(false)}
            title={t("nav.menu")}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        ) : null}
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-card-sm text-sm text-dp-error hover:bg-dp-error-bg transition-all",
            collapsed && "justify-center px-2"
          )}
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("nav.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-dp-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 bg-dp-surface border-e border-dp-border",
          "transition-all duration-300",
          "lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {SidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dp-surface/80 backdrop-blur-lg border-b border-dp-border h-14 flex items-center px-4 sm:px-6 gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex-1" />

          {/* View public profile */}
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5" asChild>
            <Link href={`/${locale}/business/my-business`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {locale === "ar" ? "عرض الملف" : locale === "he" ? "הצג פרופיל" : "View Profile"}
            </Link>
          </Button>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative h-9 w-9 rounded-full border border-dp-border flex items-center justify-center hover:bg-dp-surface-alt transition-colors"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={locale === "ar" ? "الإشعارات" : locale === "he" ? "התראות" : "Notifications"}
            >
              <Bell className="h-4 w-4 text-dp-text-muted" />
              <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-dp-error text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
            </button>
            {notificationsOpen && (
              <div className="absolute end-0 mt-2 w-64 rounded-card border border-dp-border bg-dp-surface shadow-overlay p-3 text-sm z-40">
                <p className="font-medium text-dp-text-primary mb-1">
                  {locale === "ar"
                    ? "الإشعارات (تجريبية)"
                    : locale === "he"
                    ? "התראות (ניסוי)"
                    : "Notifications (preview)"}
                </p>
                <p className="text-dp-text-muted">
                  {locale === "ar"
                    ? "سيتم تفعيل الإشعارات الحقيقية لاحقًا."
                    : locale === "he"
                    ? "התראות אמיתיות יפעלו בהמשך."
                    : "Real notifications will be wired up later."}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
