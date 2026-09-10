import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CmsPermission,
  canAccessCmsStudio,
  capabilitiesFromRoles,
  cmsPermissionsForRoles,
  hasCmsPermission,
} from "./cms-rbac";
import { sanitizeSiteDocumentForSave } from "./cms-doc-guard";
import type { SiteDocument } from "../builder/types";

describe("cms-rbac", () => {
  it("cms_viewer: lecture seule", () => {
    const caps = capabilitiesFromRoles(["cms_viewer"]);
    assert.equal(caps.canRead, true);
    assert.equal(caps.canEdit, false);
    assert.equal(caps.canPublish, false);
    assert.equal(caps.canManageMedia, false);
    assert.equal(caps.canManageTheme, false);
  });

  it("cms_editor: brouillon sans publish/thème", () => {
    const caps = capabilitiesFromRoles(["cms_editor"]);
    assert.equal(caps.canEdit, true);
    assert.equal(caps.canPublish, false);
    assert.equal(caps.canManageMedia, true);
    assert.equal(caps.canManageTheme, false);
  });

  it("cms_publisher: full CMS", () => {
    const caps = capabilitiesFromRoles(["cms_publisher"]);
    assert.equal(caps.canPublish, true);
    assert.equal(caps.canManageTheme, true);
  });

  it("admin hérite de tout", () => {
    assert.ok(hasCmsPermission(["admin"], CmsPermission.SITE_PUBLISH));
    assert.ok(canAccessCmsStudio(["super_admin"]));
  });

  it("customer n’a pas accès studio", () => {
    assert.equal(canAccessCmsStudio(["customer"]), false);
    assert.equal(cmsPermissionsForRoles(["finance"]).size, 0);
  });
});

describe("cms-doc-guard", () => {
  const base = {
    version: 1 as const,
    updatedAt: "2026-01-01T00:00:00.000Z",
    settings: {
      brand: "A",
      tagline: "t",
      primaryCta: { label: "x", href: "/" },
      theme: {
        accent: "#111",
        sun: "#222",
        background: "#fff",
        foreground: "#000",
      },
    },
    nav: [],
    footer: { blurb: "", links: [], showStudioLink: true },
    pages: [],
    blog: [],
    media: [],
  } satisfies SiteDocument;

  it("strip theme sans cms.theme.manage", () => {
    const incoming: SiteDocument = {
      ...base,
      settings: {
        ...base.settings,
        brand: "HACKED",
        theme: { ...base.settings.theme, accent: "#ff0000" },
      },
      pages: [
        {
          id: "p1",
          slug: "x",
          title: "X",
          status: "draft",
          seo: {},
          blocks: [],
        },
      ],
    };
    const out = sanitizeSiteDocumentForSave(incoming, base, {
      canEdit: true,
      canManageTheme: false,
    });
    assert.equal(out.settings.brand, "A");
    assert.equal(out.settings.theme.accent, "#111");
    assert.equal(out.pages.length, 1);
  });
});
