import { NextResponse } from "next/server";
import { requireCmsPermission } from "@/lib/cms-auth";
import { CmsPermission } from "@/lib/cms-rbac";
import { CONTENT_KEYS, type ContentKey } from "@/content/catalog";
import {
  CONTENT_LABELS,
  deleteOverride,
  getResolvedContent,
  listOverrideFlags,
  writeOverride,
} from "@/lib/resolve-content";

export async function GET(req: Request) {
  const denied = await requireCmsPermission(CmsPermission.SITE_READ);
  if (denied) return denied;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") as ContentKey | null;
  if (key) {
    if (!(CONTENT_KEYS as string[]).includes(key)) {
      return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
    }
    const data = await getResolvedContent(key);
    const flags = await listOverrideFlags();
    return NextResponse.json({
      key,
      label: CONTENT_LABELS[key],
      data,
      hasOverride: flags[key],
    });
  }
  const flags = await listOverrideFlags();
  return NextResponse.json({
    keys: CONTENT_KEYS.map((k) => ({
      key: k,
      label: CONTENT_LABELS[k],
      hasOverride: flags[k],
    })),
  });
}

export async function PUT(req: Request) {
  const denied = await requireCmsPermission(CmsPermission.SITE_EDIT);
  if (denied) return denied;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CMS_ALLOW_WRITE !== "true"
  ) {
    return NextResponse.json(
      {
        error:
          "Écriture désactivée en production. Activez CMS_ALLOW_WRITE=true.",
      },
      { status: 403 },
    );
  }

  const body = (await req.json()) as {
    key?: string;
    data?: unknown;
    reset?: boolean;
  };
  if (!body.key || !(CONTENT_KEYS as string[]).includes(body.key)) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 400 });
  }
  const key = body.key as ContentKey;

  if (body.reset) {
    await deleteOverride(key);
    return NextResponse.json({
      ok: true,
      reset: true,
      data: await getResolvedContent(key),
    });
  }

  const written = await writeOverride(key, body.data ?? {});
  return NextResponse.json({
    ok: true,
    written,
    data: await getResolvedContent(key),
    hint: "Contenu publié (override actif sur le site).",
  });
}
