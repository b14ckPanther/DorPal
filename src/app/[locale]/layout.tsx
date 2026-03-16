import type { Metadata } from "next";
import { Cairo, Heebo, Ubuntu } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import { getDirection } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const LOCALES = ["ar", "he", "en"] as const;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ubuntu = Ubuntu({
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | DorPal",
    default: "DorPal — Your Booking Companion",
  },
  description:
    "Discover and book beauty and wellness services near you with ease and speed",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as (typeof LOCALES)[number])) {
    notFound();
  }
  const messages = await getMessages();
  const dir = getDirection(locale);

  const fontClass =
    locale === "ar"
      ? "font-ar"
      : locale === "he"
        ? "font-he"
        : "font-en";

  return (
    <div
      dir={dir}
      lang={locale}
      className={`${cairo.variable} ${heebo.variable} ${ubuntu.variable} ${fontClass} antialiased min-h-screen`}
    >
      <NextIntlClientProvider messages={messages}>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </NextIntlClientProvider>
      <Toaster
        position={dir === "rtl" ? "bottom-right" : "bottom-left"}
        richColors
        toastOptions={{
          style: {
            fontFamily: "inherit",
            direction: dir,
          },
        }}
      />
    </div>
  );
}
