import { NextResponse } from "next/server";
import {
  getCmsEditorIdentity,
  requireCmsPermission,
} from "@/lib/cms-auth";
import { appendCmsAudit } from "@/lib/cms-audit";
import { CmsPermission } from "@/lib/cms-rbac";
import {
  listSiteVersions,
  readSiteVersion,
} from "@/lib/cms-versions";
import {
  assertWritable,
  publishSite,
  restoreVersionToDraft,
} from "@/lib/site-store";

export async function GET() {
  const denied = await requireCmsPermission(CmsPermission.SITE_READ);
  if (denied) return denied;
  const versions = await listSiteVersions();
  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  try {
    assertWritable();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Écriture refusée" },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    action?: "restore_draft" | "restore_publish";
    versionId?: string;
  };
  if (!body.versionId) {
    return NextResponse.json({ error: "versionId requis" }, { status: 400 });
  }

  const snap = await readSiteVersion(body.versionId);
  if (!snap) {
    return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
  }

  const id = await getCmsEditorIdentity();
  const actor = {
    mode: (id.mode ?? "unknown") as "keycloak" | "password" | "unknown",
    name: id.name,
    email: id.email,
    roles: id.roles,
  };

  if (body.action === "restore_publish") {
    const denied = await requireCmsPermission(CmsPermission.SITE_PUBLISH);
    if (denied) return denied;
    await restoreVersionToDraft(snap.doc);
    const published = await publishSite(true, {
      actor: actor.name || actor.email,
      label: `restore:${body.versionId}`,
    });
    await appendCmsAudit({
      action: "publish",
      actor,
      detail: `restore_publish:${body.versionId}`,
    });
    return NextResponse.json({
      ok: true,
      restored: "publish",
      doc: published.doc,
      versionId: published.versionId,
    });
  }

  const denied = await requireCmsPermission(CmsPermission.SITE_EDIT);
  if (denied) return denied;
  const doc = await restoreVersionToDraft(snap.doc);
  await appendCmsAudit({
    action: "save_draft",
    actor,
    detail: `restore_draft:${body.versionId}`,
  });
  return NextResponse.json({ ok: true, restored: "draft", doc });
}
