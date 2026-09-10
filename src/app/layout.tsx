import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ThemeStyle } from "@/components/theme-style";
import { AuthProvider } from "@/components/auth-provider";
import {
  COUNTRY_COOKIE,
  LOCALE_COOKIE,
  LOCALE_META,
  localeFromAcceptLanguage,
  normalizeCountry,
  normalizeLocale,
  type CountryCode,
  type Locale,
} from "@/lib/i18n/config";

const display = Fraunces({
  variable: "--font-cms-display",
  subsets: ["latin"],
  display: "swap",
});

const sans = Source_Sans_3({
  variable: "--font-cms-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Community — Épargne collective",
    template: "%s · Community",
  },
  description:
    "Community : tontines, cotisations et épargne collective pour les communautés.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const hdrs = await headers();
  const country = normalizeCountry(jar.get(COUNTRY_COOKIE)?.value ?? "BI");
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = cookieLocale
    ? normalizeLocale(cookieLocale, country)
    : localeFromAcceptLanguage(hdrs.get("accept-language"), country);

  return (
    <html lang={LOCALE_META[locale].bcp47}>
      <body
        className={`${display.variable} ${sans.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <ThemeStyle />
        <AuthProvider locale={locale} country={country as CountryCode}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
