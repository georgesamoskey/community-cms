import type { SiteDocument, SiteLocaleOverlay } from "@/builder/types";

export function resolveLocale(
  doc: SiteDocument,
  requested?: string | null,
): string {
  const def = doc.settings.i18n?.defaultLocale ?? "fr";
  const locales = doc.settings.i18n?.locales ?? [def];
  if (requested && locales.includes(requested)) return requested;
  return def;
}

export function applyLocaleOverlay(
  doc: SiteDocument,
  locale: string,
): SiteDocument {
  const def = doc.settings.i18n?.defaultLocale ?? "fr";
  if (locale === def || !doc.localeOverlays?.[locale]) return doc;
  const o: SiteLocaleOverlay = doc.localeOverlays[locale]!;
  return {
    ...doc,
    settings: {
      ...doc.settings,
      ...(o.settings?.brand ? { brand: o.settings.brand } : {}),
      ...(o.settings?.tagline ? { tagline: o.settings.tagline } : {}),
      ...(o.settings?.primaryCta
        ? { primaryCta: o.settings.primaryCta }
        : {}),
    },
    nav: o.nav ?? doc.nav,
    footer: {
      ...doc.footer,
      ...(o.footer?.blurb ? { blurb: o.footer.blurb } : {}),
      ...(o.footer?.links ? { links: o.footer.links } : {}),
    },
  };
}
