import { getRequestConfig } from "next-intl/server";

const locales = ["ar", "he", "en"] as const;
const defaultLocale = "ar";
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  const [
    common, nav, home, search, business, booking, auth, dashboard, admin, apply
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/nav.json`),
    import(`../../messages/${locale}/home.json`),
    import(`../../messages/${locale}/search.json`),
    import(`../../messages/${locale}/business.json`),
    import(`../../messages/${locale}/booking.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/dashboard.json`),
    import(`../../messages/${locale}/admin.json`),
    import(`../../messages/${locale}/apply.json`),
  ]);

  const messages = {
    ...common.default,
    ...nav.default,
    ...home.default,
    ...search.default,
    ...business.default,
    ...booking.default,
    ...auth.default,
    ...dashboard.default,
    ...admin.default,
    ...apply.default,
  };

  return {
    locale: locale as string,
    messages,
  };
});
