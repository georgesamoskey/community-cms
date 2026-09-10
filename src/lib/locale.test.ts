import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SiteDocument } from "../builder/types";
import { applyLocaleOverlay, resolveLocale } from "./locale";

const base = {
  version: 1 as const,
  updatedAt: "2026-01-01T00:00:00.000Z",
  settings: {
    brand: "Community",
    tagline: "FR",
    primaryCta: { label: "Connexion", href: "/login" },
    theme: {
      accent: "#167a66",
      sun: "#f0c14d",
      background: "#f4f7f6",
      foreground: "#122420",
    },
    i18n: { defaultLocale: "fr", locales: ["fr", "en"] },
  },
  nav: [{ id: "1", label: "Tarifs", href: "/pricing" }],
  footer: { blurb: "Blurb FR", links: [], showStudioLink: true },
  pages: [],
  blog: [],
  media: [],
  localeOverlays: {
    en: {
      settings: { brand: "Community EN", tagline: "EN" },
      nav: [{ id: "1", label: "Pricing", href: "/pricing" }],
      footer: { blurb: "Blurb EN" },
    },
  },
} satisfies SiteDocument;

describe("locale", () => {
  it("resolveLocale respects request and default", () => {
    assert.equal(resolveLocale(base, "en"), "en");
    assert.equal(resolveLocale(base, "de"), "fr");
    assert.equal(resolveLocale(base, null), "fr");
  });

  it("applyLocaleOverlay swaps chrome for en", () => {
    const en = applyLocaleOverlay(base, "en");
    assert.equal(en.settings.brand, "Community EN");
    assert.equal(en.settings.tagline, "EN");
    assert.equal(en.nav[0]?.label, "Pricing");
    assert.equal(en.footer.blurb, "Blurb EN");
  });

  it("applyLocaleOverlay is noop for default", () => {
    const fr = applyLocaleOverlay(base, "fr");
    assert.equal(fr.settings.brand, "Community");
    assert.equal(fr.nav[0]?.label, "Tarifs");
  });
});
