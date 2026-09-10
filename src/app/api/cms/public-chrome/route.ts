import { NextResponse } from "next/server";
import { applyLocaleOverlay, resolveLocale } from "@/lib/locale";
import { getPublicSiteDocument } from "@/lib/site-store";

/** Chrome public (nav/footer/brand) — pas d’auth requise. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const { doc: raw } = await getPublicSiteDocument(
    url.searchParams.get("preview") === "1",
  );
  const locale = resolveLocale(raw, url.searchParams.get("lang"));
  const doc = applyLocaleOverlay(raw, locale);
  return NextResponse.json({
    settings: doc.settings,
    nav: doc.nav,
    footer: doc.footer,
    locale,
    locales: doc.settings.i18n?.locales ?? [locale],
    defaultLocale: doc.settings.i18n?.defaultLocale ?? locale,
  });
}
