import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireCmsPermission, getCmsEditorIdentity } from "@/lib/cms-auth";
import { appendCmsAudit } from "@/lib/cms-audit";
import { CmsPermission } from "@/lib/cms-rbac";
import { assertWritable, getSiteDocument, saveDraft } from "@/lib/site-store";
import { uid } from "@/builder/defaults";
import type { MediaAsset } from "@/builder/types";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cms");

export async function GET() {
  const denied = await requireCmsPermission(CmsPermission.SITE_READ);
  if (denied) return denied;
  const doc = await getSiteDocument("draft");
  return NextResponse.json({ media: doc.media });
}

export async function POST(req: Request) {
  const denied = await requireCmsPermission(CmsPermission.MEDIA_MANAGE);
  if (denied) return denied;
  try {
    assertWritable();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Écriture refusée" },
      { status: 403 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > 4_000_000) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 4 Mo)" }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!mime.startsWith("image/") && mime !== "application/pdf") {
    return NextResponse.json(
      { error: "Types acceptés : images et PDF" },
      { status: 400 },
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || (mime.includes("png") ? ".png" : ".bin");
  const safe = `${Date.now()}-${uid("m")}${ext}`.replace(/[^a-zA-Z0-9._-]/g, "");
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, safe), buf);

  const asset: MediaAsset = {
    id: uid("media"),
    name: file.name,
    url: `/uploads/cms/${safe}`,
    mime,
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  const doc = await getSiteDocument("draft");
  doc.media = [asset, ...doc.media];
  await saveDraft(doc);

  const id = await getCmsEditorIdentity();
  await appendCmsAudit({
    action: "media_upload",
    actor: {
      mode: (id.mode ?? "unknown") as "keycloak" | "password" | "unknown",
      name: id.name,
      email: id.email,
      roles: id.roles,
    },
    detail: asset.name,
  });

  return NextResponse.json({ ok: true, asset, media: doc.media });
}
