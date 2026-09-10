import { promises as fs } from "fs";
import path from "path";
import type { SiteDocument } from "@/builder/types";

const SITE_DIR = path.join(process.cwd(), "src/content/_site");
const VERSIONS_DIR = path.join(SITE_DIR, "versions");
const MAX_VERSIONS = 30;

export type SiteVersionMeta = {
  id: string;
  createdAt: string;
  label?: string;
  actor?: string;
  pages: number;
};

function versionPath(id: string) {
  return path.join(VERSIONS_DIR, `${id}.json`);
}

export async function snapshotPublishedVersion(
  doc: SiteDocument,
  meta?: { label?: string; actor?: string },
): Promise<SiteVersionMeta> {
  await fs.mkdir(VERSIONS_DIR, { recursive: true });
  const id = `v_${Date.now().toString(36)}`;
  const entry: SiteVersionMeta & { doc: SiteDocument } = {
    id,
    createdAt: new Date().toISOString(),
    label: meta?.label,
    actor: meta?.actor,
    pages: doc.pages.length,
    doc,
  };
  await fs.writeFile(versionPath(id), JSON.stringify(entry, null, 2), "utf8");
  await pruneOldVersions();
  return {
    id,
    createdAt: entry.createdAt,
    label: entry.label,
    actor: entry.actor,
    pages: entry.pages,
  };
}

async function pruneOldVersions() {
  const files = (await fs.readdir(VERSIONS_DIR))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  for (const f of files.slice(MAX_VERSIONS)) {
    await fs.unlink(path.join(VERSIONS_DIR, f)).catch(() => undefined);
  }
}

export async function listSiteVersions(): Promise<SiteVersionMeta[]> {
  try {
    const files = (await fs.readdir(VERSIONS_DIR)).filter((f) =>
      f.endsWith(".json"),
    );
    const metas: SiteVersionMeta[] = [];
    for (const f of files) {
      try {
        const raw = await fs.readFile(path.join(VERSIONS_DIR, f), "utf8");
        const j = JSON.parse(raw) as SiteVersionMeta;
        metas.push({
          id: j.id,
          createdAt: j.createdAt,
          label: j.label,
          actor: j.actor,
          pages: j.pages,
        });
      } catch {
        /* skip */
      }
    }
    return metas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function readSiteVersion(
  id: string,
): Promise<{ meta: SiteVersionMeta; doc: SiteDocument } | null> {
  try {
    const raw = await fs.readFile(versionPath(id), "utf8");
    const j = JSON.parse(raw) as SiteVersionMeta & { doc: SiteDocument };
    if (!j.doc?.pages) return null;
    return {
      meta: {
        id: j.id,
        createdAt: j.createdAt,
        label: j.label,
        actor: j.actor,
        pages: j.pages,
      },
      doc: j.doc,
    };
  } catch {
    return null;
  }
}
