import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

type Props = { params: Promise<{ locale: string }> };

function getRedirectPath(role: UserRole | null, locale: string) {
  if (role === "business_owner" || role === "staff") {
    return `/${locale}/dashboard`;
  }
  if (role === "super_admin") {
    return `/${locale}/admin`;
  }
  return `/${locale}/my-bookings`;
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = (profile as { role?: UserRole } | null)?.role ?? null;
    redirect(getRedirectPath(role, locale));
  }
  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <LoginForm locale={locale} />
      </main>
    </div>
  );
}
