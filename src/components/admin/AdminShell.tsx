"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ClipboardList, Building2, Users, Star, CreditCard, FileText,
  LogOut, Menu, X, Shield, Bell, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

interface AdminShellProps {
  locale: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { icon: ClipboardList, key: "applications", path: "" },
  { icon: Building2, key: "businesses", path: "/businesses" },
  { icon: Users, key: "users", path: "/users" },
  { icon: Star, key: "reviews", path: "/reviews" },
  { icon: CreditCard, key: "subscriptions", path: "/subscriptions" },
  { icon: FileText, key: "audit", path: "/audit" },
];

export function AdminShell({ locale, children }: AdminShellProps) {
  const t = useTranslations();
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function getPath(path: string) {
    return `/${locale}/admin${path}`;
  }

  function isActive(path: string) {
    const full = getPath(path);
    if (path === "") return pathname === full;
    return pathname.startsWith(full);
  }

  return (
    <div className="min-h-screen flex bg-dp-text-primary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 bg-[#140D21] border-e border-white/10",
          "transition-all duration-300",
          "lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="DorPal"
                width={100}
                height={32}
                className="h-8 w-auto object-contain brightness-0 invert opacity-95 bg-transparent"
                unoptimized
                style={{ background: "transparent" }}
              />
              <div>
                <p className="text-white/40 text-xs">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Admin info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-brand-iris flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {profile?.full_name ?? "Super Admin"}
                </p>
                <p className="text-xs text-white/40">super_admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5">
            {NAV_ITEMS.map(({ icon: Icon, key, path }) => (
              <Link
                key={key}
                href={getPath(path)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-card-sm text-sm transition-all",
                  isActive(path)
                    ? "bg-brand-iris text-white font-medium"
                    : "text-white/60 hover:bg-white/8 hover:text-white"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{t(`admin.nav.${key}`)}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-white/10">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-card-sm text-sm text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-dp-bg">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-dp-surface/90 backdrop-blur-lg border-b border-dp-border h-14 flex items-center px-4 sm:px-6 gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Search */}
          <div className="hidden sm:flex flex-1 relative max-w-xs">
            <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-dp-text-muted pointer-events-none" />
            <input
              placeholder={t("admin.search_placeholder")}
              className="w-full h-9 ps-9 pe-4 bg-dp-surface-alt rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-iris/30"
            />
          </div>

          <div className="flex-1 sm:flex-none" />

          {/* Notifications */}
          <button className="relative h-9 w-9 rounded-full border border-dp-border flex items-center justify-center hover:bg-dp-surface-alt">
            <Bell className="h-4 w-4 text-dp-text-muted" />
            <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-dp-error text-white text-[10px] font-bold flex items-center justify-center">
              5
            </span>
          </button>

          {/* Back to dashboard */}
          <Button variant="plum" size="sm" className="hidden sm:flex gap-1.5" asChild>
            <Link href={`/${locale}/dashboard`}>
              <Shield className="h-3.5 w-3.5" />
              {t("admin.back_to_dashboard")}
            </Link>
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
