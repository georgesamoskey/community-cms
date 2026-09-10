import type { SiteDocument } from "@/builder/types";
import type { CmsCapabilities } from "@/lib/cms-rbac";

/**
 * Applique les garde-fous permissions sur un document entrant
 * (ex. sans cms.theme.manage → settings figés).
 */
export function sanitizeSiteDocumentForSave(
  incoming: SiteDocument,
  current: SiteDocument,
  caps: Pick<CmsCapabilities, "canManageTheme" | "canEdit">,
): SiteDocument {
  const next: SiteDocument = {
    ...incoming,
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  if (!caps.canManageTheme) {
    next.settings = current.settings;
    next.localeOverlays = current.localeOverlays;
  }

  if (!caps.canEdit) {
    // Ne devrait pas arriver (API refuse SITE_EDIT) — filet de sécurité
    next.pages = current.pages;
    next.nav = current.nav;
    next.footer = current.footer;
    next.blog = current.blog;
    if (!caps.canManageTheme) {
      next.media = current.media;
    }
  }

  return next;
}

export function settingsChanged(
  a: SiteDocument["settings"],
  b: SiteDocument["settings"],
): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
