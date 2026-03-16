"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SignupFormProps {
  locale: string;
}

export function SignupForm({ locale }: SignupFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });
      if (error) throw error;
      setDone(true);
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
          {t("auth.signup.title")}
        </h1>
        <p className="text-dp-text-muted">{t("auth.signup.subtitle")}</p>
      </div>

      {/* Card */}
      <div className="bg-dp-surface rounded-card border border-dp-border shadow-card p-6 sm:p-8">
        {done ? (
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-full bg-dp-success-bg flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-dp-success" />
            </div>
            <h2 className="font-semibold text-dp-text-primary mb-2">
              {t("auth.check_email")}
            </h2>
            <p className="text-sm text-dp-text-muted">
              {t("auth.magic_link.sent")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label={t("auth.signup.full_name")}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              startIcon={<User className="h-4 w-4" />}
              autoComplete="name"
            />
            <Input
              label={t("auth.signup.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              startIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />
            <Input
              label={t("auth.signup.phone")}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              startIcon={<Phone className="h-4 w-4" />}
              autoComplete="tel"
              dir="ltr"
            />
            <Input
              label={t("auth.signup.password")}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              startIcon={<Lock className="h-4 w-4" />}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer text-dp-text-muted hover:text-dp-text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              autoComplete="new-password"
            />

            <p className="text-xs text-dp-text-muted leading-relaxed">
              {t("auth.signup.terms")}
            </p>

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              {t("auth.signup.submit")}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-dp-text-muted mt-6">
          {t("auth.signup.have_account")}{" "}
          <Link
            href={`/${locale}/login`}
            className="text-brand-iris font-medium hover:underline"
          >
            {t("auth.signup.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
