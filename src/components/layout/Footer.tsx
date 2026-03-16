import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  Instagram,
  Facebook,
  Twitter,
  Mail,
  Phone,
} from "lucide-react";

interface FooterProps {
  locale: string;
}

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations();

  function getLocalePath(path: string) {
    return `/${locale}${path}`;
  }

  return (
    <footer className="bg-dp-text-primary text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4 bg-transparent">
              <Image
                src="/logo.png"
                alt="DorPal"
                width={140}
                height={42}
                className="h-9 w-auto object-contain opacity-95 bg-transparent brightness-0 invert"
                unoptimized
                style={{ background: "transparent" }}
              />
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-[260px]">
              {t("home.footer.tagline")}
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Twitter, href: "#", label: "Twitter" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* For customers */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">
              للعملاء
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "البحث عن خدمة", path: "/search" },
                { label: "حجوزاتي", path: "/my-bookings" },
                { label: "تسجيل الدخول", path: "/login" },
                { label: "إنشاء حساب", path: "/signup" },
              ].map(({ label, path }) => (
                <li key={path}>
                  <Link
                    href={getLocalePath(path)}
                    className="text-white/60 text-sm hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For businesses */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">
              للأعمال
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "انضم إلينا", path: "/apply" },
                { label: "لوحة التحكم", path: "/dashboard" },
                { label: "خطط الاشتراك", path: "/pricing" },
                { label: "مركز المساعدة", path: "/help" },
              ].map(({ label, path }) => (
                <li key={path}>
                  <Link
                    href={getLocalePath(path)}
                    className="text-white/60 text-sm hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-white/90">
              تواصل معنا
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-white/60 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-brand-iris" />
                <span>hello@dorpal.co.il</span>
              </li>
              <li className="flex items-center gap-2.5 text-white/60 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-brand-iris" />
                <span dir="ltr">+972 50 000 0000</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
          <span>© {new Date().getFullYear()} دور بال. {t("home.footer.rights")}.</span>
          <div className="flex items-center gap-4">
            <Link
              href={getLocalePath("/privacy")}
              className="hover:text-white transition-colors"
            >
              {t("home.footer.privacy")}
            </Link>
            <Link
              href={getLocalePath("/terms")}
              className="hover:text-white transition-colors"
            >
              {t("home.footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
