"use client";

import { useEffect } from "react";

export function HtmlLangDir({
  locale,
  dir,
  children,
}: {
  locale: string;
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", dir);
  }, [locale, dir]);
  return <>{children}</>;
}
