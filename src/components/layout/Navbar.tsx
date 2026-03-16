"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface NavbarProps {
  locale: string;
}

const LOCALES = [
  { code: "ar", labelKey: "nav.ar", dir: "rtl" },
  { code: "he", labelKey: "nav.he", dir: "rtl" },
  { code: "en", labelKey: "nav.en", dir: "ltr" },
];

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations();
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRTL = locale !== "en";

  function switchLocale(newLocale: string) {
    const segments = pathname.split("/");
    segments[1] = newLocale;

    // Keep NEXT_LOCALE cookie in sync so RootLayout picks correct dir/lang
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    }

    router.push(segments.join("/"));
  }

  function getLocalePath(path: string) {
    return `/${locale}${path}`;
  }

  const isActive = (path: string) =>
    pathname === `/${locale}${path}` ||
    pathname.startsWith(`/${locale}${path}/`);
  const currentLocale = LOCALES.find((l) => l.code === locale);

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-dp-border/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href={getLocalePath("")}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <Image
            src="/logo.png"
            alt="DorPal"
            width={120}
            height={36}
            className="h-8 w-auto object-contain bg-transparent"
            priority
            unoptimized
            style={{ background: "transparent" }}
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href={getLocalePath("/search")} active={isActive("/search")}>
            {t("nav.search")}
          </NavLink>
          <NavLink
            href={getLocalePath("/apply")}
            active={isActive("/apply")}
          >
            {t("nav.for_businesses")}
          </NavLink>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Locale switcher */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-dp-text-secondary">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:block text-sm">
                  {currentLocale ? t(currentLocale.labelKey) : ""}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[120px] rounded-card border border-dp-border bg-dp-surface shadow-overlay p-1 animate-in fade-in-0 zoom-in-95"
                align={isRTL ? "start" : "end"}
                sideOffset={6}
              >
                {LOCALES.map((loc) => (
                  <DropdownMenu.Item
                    key={loc.code}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none",
                      "hover:bg-dp-surface-alt transition-colors",
                      locale === loc.code
                        ? "text-brand-iris font-medium"
                        : "text-dp-text-primary"
                    )}
                    onSelect={() => switchLocale(loc.code)}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full",
                        locale === loc.code ? "bg-brand-iris" : "bg-dp-border"
                      )}
                    />
                    <span dir={loc.dir}>{t(loc.labelKey)}</span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Auth section */}
          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-dp-border px-3 py-1.5 bg-dp-surface hover:bg-dp-surface-alt transition-colors">
                  <div className="h-6 w-6 rounded-full bg-brand-iris flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-sm font-medium text-dp-text-primary max-w-[100px] truncate hidden sm:block">
                    {profile?.full_name?.split(" ")[0] ?? "User"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-dp-text-muted" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[200px] rounded-card border border-dp-border bg-dp-surface shadow-overlay p-1 animate-in fade-in-0 zoom-in-95"
                  align={isRTL ? "start" : "end"}
                  sideOffset={6}
                >
                  <div className="px-3 py-2 border-b border-dp-border mb-1">
                    <p className="text-sm font-semibold text-dp-text-primary">
                      {profile?.full_name}
                    </p>
                    <p className="text-xs text-dp-text-muted truncate">
                      {profile?.email}
                    </p>
                  </div>
                  {(profile?.role === "business_owner" ||
                    profile?.role === "staff") && (
                    <DropdownMenuItem
                      href={getLocalePath("/dashboard")}
                      icon={<LayoutDashboard className="h-4 w-4" />}
                    >
                      {t("nav.dashboard")}
                    </DropdownMenuItem>
                  )}
                  {profile?.role === "super_admin" && (
                    <DropdownMenuItem
                      href={getLocalePath("/admin")}
                      icon={<Shield className="h-4 w-4" />}
                    >
                      {t("nav.admin")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    href={getLocalePath("/my-bookings")}
                    icon={<CalendarDays className="h-4 w-4" />}
                  >
                    {t("nav.my_bookings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    href={getLocalePath("/profile")}
                    icon={<User className="h-4 w-4" />}
                  >
                    {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenu.Separator className="h-px bg-dp-border my-1" />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none text-dp-error hover:bg-dp-error-bg transition-colors"
                    onSelect={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={getLocalePath("/login")}>{t("nav.login")}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={getLocalePath("/signup")}>{t("nav.signup")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("nav.menu")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dp-border bg-dp-surface/95 backdrop-blur-lg px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <MobileNavLink
            href={getLocalePath("/search")}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.search")}
          </MobileNavLink>
          <MobileNavLink
            href={getLocalePath("/apply")}
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.for_businesses")}
          </MobileNavLink>
          {!user && (
            <div className="flex flex-col gap-2 pt-2 border-t border-dp-border">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={getLocalePath("/login")}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.login")}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link
                  href={getLocalePath("/signup")}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav.signup")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 rounded-card-sm text-sm font-medium transition-colors",
        active
          ? "text-brand-iris bg-brand-iris/8"
          : "text-dp-text-secondary hover:text-dp-text-primary hover:bg-dp-surface-alt"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2.5 rounded-card-sm text-sm font-medium text-dp-text-primary hover:bg-dp-surface-alt transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function DropdownMenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none text-dp-text-primary hover:bg-dp-surface-alt transition-colors"
      >
        <span className="text-dp-text-muted">{icon}</span>
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}

