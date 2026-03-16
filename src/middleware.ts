import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const locales = ["ar", "he", "en"] as const;
const defaultLocale = "ar";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

function stripLocalePrefix(pathname: string) {
  const localePrefix = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);
  const stripped = pathname.replace(localePrefix, "");
  return stripped.length === 0 ? "/" : stripped;
}

function needsAuthRefresh(pathname: string) {
  const protectedPrefixes = ["/dashboard", "/admin", "/profile", "/my-bookings"];
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const pathname = stripLocalePrefix(request.nextUrl.pathname);

  // Avoid auth roundtrips for public routes.
  if (!needsAuthRefresh(pathname)) {
    return response;
  }

  // Keep local development snappy when using placeholder config.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co") {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|logo\\.png).*)",
  ],
};
