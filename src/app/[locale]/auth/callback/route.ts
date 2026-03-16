import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/database";

function getRedirectPath(role: UserRole | null, locale: string, origin: string) {
  if (role === "business_owner" || role === "staff") {
    return `${origin}/${locale}/dashboard`;
  }
  if (role === "super_admin") {
    return `${origin}/${locale}/admin`;
  }
  return `${origin}/${locale}/my-bookings`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  let role: UserRole | null = null;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = (profile as { role?: UserRole } | null)?.role ?? null;
    }
  }

  const redirectTo = getRedirectPath(role, locale, requestUrl.origin);
  return NextResponse.redirect(redirectTo);
}
