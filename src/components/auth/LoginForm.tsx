"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { UserRole } from "@/types/database";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  function getRedirectPath(role: UserRole | null, locale: string) {
    if (role === "business_owner" || role === "staff") {
      return `/${locale}/dashboard`;
    }
    if (role === "super_admin") {
      return `/${locale}/admin`;
    }
    return `/${locale}/my-bookings`;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      let role: UserRole | null = null;
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        role = (profile as { role?: UserRole } | null)?.role ?? null;
      }
      const redirectTo = getRedirectPath(role, locale);
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.generic");
      toast.error(t("auth.errors.invalid_credentials"), { description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectBase =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectBase}/${locale}/auth/callback`,
        },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.generic");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4 bg-transparent">
          <Image
            src="/logo.png"
            alt="DorPal"
            width={160}
            height={48}
            className="h-14 w-auto object-contain bg-transparent"
            unoptimized
            style={{ background: "transparent" }}
          />
        </div>
        <h1 className="text-2xl font-bold text-dp-text-primary mb-1">
          {t("auth.login.title")}
        </h1>
        <p className="text-dp-text-muted">{t("auth.login.subtitle")}</p>
      </div>

      {/* Card */}
      <div className="bg-dp-surface rounded-card border border-dp-border shadow-card p-6 sm:p-8">
        {magicSent ? (
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-full bg-dp-success-bg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-dp-success" />
            </div>
            <h2 className="font-semibold text-dp-text-primary mb-2">
              {t("auth.check_email")}
            </h2>
            <p className="text-sm text-dp-text-muted mb-4">
              {t("auth.magic_link.sent")}
            </p>
            <p className="text-sm font-medium text-brand-iris">{email}</p>
          </div>
        ) : (
          <form onSubmit={magicLinkMode ? handleMagicLink : handleLogin} className="space-y-5">
            <Input
              label={t("auth.login.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              startIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            {!magicLinkMode && (
              <div>
                <Input
                  label={t("auth.login.password")}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  startIcon={<Lock className="h-4 w-4" />}
                  endIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer text-dp-text-muted hover:text-dp-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  autoComplete="current-password"
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-xs text-brand-iris hover:underline"
                  >
                    {t("auth.login.forgot_password")}
                  </Link>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {magicLinkMode
                ? t("auth.login.send_magic_link")
                : t("auth.login.submit")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dp-border" />
              </div>
              <div className="relative flex justify-center text-xs text-dp-text-muted bg-dp-surface px-3">
                {t("common.or")}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => setMagicLinkMode(!magicLinkMode)}
            >
              {magicLinkMode
                ? t("auth.login.submit")
                : t("auth.login.magic_link")}
            </Button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-dp-text-muted mt-6">
          {t("auth.login.no_account")}{" "}
          <Link
            href={`/${locale}/signup`}
            className="text-brand-iris font-medium hover:underline"
          >
            {t("auth.login.sign_up")}
          </Link>
        </p>
      </div>
    </div>
  );
}
