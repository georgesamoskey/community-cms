import { promises as fs } from "fs";
import path from "path";
import { createDefaultSiteDocument } from "@/builder/defaults";
import type { SiteDocument, SiteMode, SitePage } from "@/builder/types";
import { isCmsEditorAuthenticated } from "@/lib/cms-auth";
import { snapshotPublishedVersion } from "@/lib/cms-versions";
import { notifySitePublished } from "@/lib/cms-publish-notify";

const SITE_DIR = path.join(process.cwd(), "src/content/_site");
const PUBLISHED = path.join(SITE_DIR, "published.json");
const DRAFT = path.join(SITE_DIR, "draft.json");

async function ensureDir() {
  await fs.mkdir(SITE_DIR, { recursive: true });
}

async function readJson(file: string): Promise<SiteDocument | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as SiteDocument;
  } catch {
    return null;
  }
}

async function writeJson(file: string, doc: SiteDocument) {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(doc, null, 2), "utf8");
}

export async function getSiteDocument(
  mode: SiteMode = "published",
): Promise<SiteDocument> {
  if (mode === "draft") {
    const draft = await readJson(DRAFT);
    if (draft) return draft;
  }
  const published = await readJson(PUBLISHED);
  if (published) return published;
  const seed = createDefaultSiteDocument();
  await writeJson(PUBLISHED, seed);
  await writeJson(DRAFT, seed);
  return seed;
}

/** Document à afficher sur le site public (draft si preview autorisé). */
export async function getPublicSiteDocument(
  wantPreview: boolean,
): Promise<{ doc: SiteDocument; preview: boolean }> {
  if (wantPreview && (await isCmsEditorAuthenticated())) {
    return { doc: await getSiteDocument("draft"), preview: true };
  }
  return { doc: await getSiteDocument("published"), preview: false };
}

export async function saveDraft(doc: SiteDocument): Promise<SiteDocument> {
  const next = { ...doc, updatedAt: new Date().toISOString(), version: 1 as const };
  await writeJson(DRAFT, next);
  return next;
}

export async function publishSite(
  fromDraft = true,
  opts?: { actor?: string; label?: string },
): Promise<{
  doc: SiteDocument;
  versionId?: string;
  notify?: Awaited<ReturnType<typeof notifySitePublished>>;
}> {
  const source = fromDraft
    ? await getSiteDocument("draft")
    : await getSiteDocument("published");
  const next = {
    ...source,
    updatedAt: new Date().toISOString(),
    version: 1 as const,
  };
  await writeJson(PUBLISHED, next);
  await writeJson(DRAFT, next);
  let versionId: string | undefined;
  try {
    const snap = await snapshotPublishedVersion(next, {
      actor: opts?.actor,
      label: opts?.label ?? "publish",
    });
    versionId = snap.id;
  } catch {
    /* versions best-effort */
  }
  const notify = await notifySitePublished(next);
  return { doc: next, versionId, notify };
}

export async function restoreVersionToDraft(
  doc: SiteDocument,
): Promise<SiteDocument> {
  return saveDraft(doc);
}

export async function discardDraft(): Promise<SiteDocument> {
  const published = await getSiteDocument("published");
  await writeJson(DRAFT, published);
  return published;
}

export async function hasDraftDiff(): Promise<boolean> {
  const [p, d] = await Promise.all([readJson(PUBLISHED), readJson(DRAFT)]);
  if (!d) return false;
  if (!p) return true;
  return JSON.stringify(p) !== JSON.stringify(d);
}

export function findPageBySlug(
  doc: SiteDocument,
  slugParts: string[],
): SitePage | undefined {
  const slug = slugParts.filter(Boolean).join("/");
  return doc.pages.find((p) => p.slug === slug);
}

export { publicPagePath } from "@/lib/site-path";

export function assertWritable(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CMS_ALLOW_WRITE !== "true"
  ) {
    throw new Error("Écriture désactivée (CMS_ALLOW_WRITE).");
  }
}
