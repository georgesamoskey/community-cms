import { NextResponse } from "next/server";
import {
  getCmsCapabilities,
  getCmsEditorIdentity,
  requireCmsPermission,
} from "@/lib/cms-auth";
import { appendCmsAudit } from "@/lib/cms-audit";
import { sanitizeSiteDocumentForSave } from "@/lib/cms-doc-guard";
import { CmsPermission } from "@/lib/cms-rbac";
import {
  assertWritable,
  discardDraft,
  getSiteDocument,
  hasDraftDiff,
  publishSite,
  saveDraft,
} from "@/lib/site-store";
import type { SiteDocument } from "@/builder/types";

async function actorFromSession() {
  const id = await getCmsEditorIdentity();
  return {
    mode: (id.mode ?? "unknown") as "keycloak" | "password" | "unknown",
    name: id.name,
    email: id.email,
    roles: id.roles,
  };
}

export async function GET(req: Request) {
  const denied = await requireCmsPermission(CmsPermission.SITE_READ);
  if (denied) return denied;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") === "published" ? "published" : "draft";
  const doc = await getSiteDocument(mode);
  const dirty = await hasDraftDiff();
  return NextResponse.json({ doc, dirty, mode });
}

export async function PUT(req: Request) {
  try {
    assertWritable();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Écriture refusée" },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    action?: "save" | "publish" | "discard";
    doc?: SiteDocument;
  };
  const actor = await actorFromSession();

  if (body.action === "publish") {
    const denied = await requireCmsPermission(CmsPermission.SITE_PUBLISH);
    if (denied) return denied;
    const published = await publishSite(true, {
      actor: actor.name || actor.email || actor.mode,
      label: "publish",
    });
    await appendCmsAudit({
      action: "publish",
      actor,
      detail: `pages=${published.doc.pages.length};version=${published.versionId ?? "-"}`,
    });
    return NextResponse.json({
      ok: true,
      published: true,
      doc: published.doc,
      versionId: published.versionId,
      notify: published.notify,
      dirty: false,
    });
  }

  if (body.action === "discard") {
    const denied = await requireCmsPermission(CmsPermission.SITE_PUBLISH);
    if (denied) return denied;
    const doc = await discardDraft();
    await appendCmsAudit({ action: "discard", actor });
    return NextResponse.json({ ok: true, discarded: true, doc, dirty: false });
  }

  const denied = await requireCmsPermission(CmsPermission.SITE_EDIT);
  if (denied) return denied;

  if (!body.doc || body.doc.version !== 1 || !Array.isArray(body.doc.pages)) {
    return NextResponse.json({ error: "Document invalide" }, { status: 400 });
  }

  const caps = await getCmsCapabilities();
  if (!caps) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const current = await getSiteDocument("draft");
  const sanitized = sanitizeSiteDocumentForSave(body.doc, current, caps);

  if (
    !caps.canManageTheme &&
    JSON.stringify(body.doc.settings) !== JSON.stringify(current.settings)
  ) {
    // Tentative de changer le thème sans droit → on sauve le reste, on signale
    await appendCmsAudit({
      action: "save_draft",
      actor,
      detail: "theme_changes_stripped",
    });
  }

  const doc = await saveDraft(sanitized);
  await appendCmsAudit({
    action: "save_draft",
    actor,
    detail: `pages=${doc.pages.length}`,
  });
  return NextResponse.json({
    ok: true,
    saved: true,
    doc,
    dirty: await hasDraftDiff(),
    themeLocked: !caps.canManageTheme,
  });
}
