import { promises as fs } from "fs";
import path from "path";
import {
  contentCatalog,
  type ContentKey,
} from "@/content/catalog";

const OVERRIDES_DIR = path.join(process.cwd(), "src/content/_overrides");

function overridePath(key: ContentKey): string {
  return path.join(OVERRIDES_DIR, `${key.replace(/\./g, "-")}.json`);
}

/** Merge superficiel objet + remplacement tableaux si fournis. */
export function mergeContent<T>(base: T, override: unknown): T {
  if (override == null || typeof override !== "object") return base;
  if (Array.isArray(base)) {
    return (Array.isArray(override) ? override : base) as T;
  }
  if (typeof base !== "object" || base === null) {
    return override as T;
  }
  const out: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    if (v === undefined) continue;
    const prev = out[k];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      prev !== null &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      out[k] = mergeContent(prev, v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

export async function readOverride(key: ContentKey): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(overridePath(key), "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function writeOverride(
  key: ContentKey,
  data: unknown,
): Promise<string> {
  await fs.mkdir(OVERRIDES_DIR, { recursive: true });
  const file = overridePath(key);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  return file;
}

export async function deleteOverride(key: ContentKey): Promise<boolean> {
  try {
    await fs.unlink(overridePath(key));
    return true;
  } catch {
    return false;
  }
}

export async function getResolvedContent<K extends ContentKey>(
  key: K,
): Promise<(typeof contentCatalog)[K]> {
  const base = contentCatalog[key];
  const override = await readOverride(key);
  if (!override) return base;
  return mergeContent(base, override);
}

export async function listOverrideFlags(): Promise<
  Record<ContentKey, boolean>
> {
  const flags = {} as Record<ContentKey, boolean>;
  for (const key of Object.keys(contentCatalog) as ContentKey[]) {
    flags[key] = (await readOverride(key)) != null;
  }
  return flags;
}

export const CONTENT_LABELS: Record<ContentKey, string> = {
  home: "Accueil",
  features: "Fonctionnalités",
  pricing: "Tarifs",
  about: "À propos",
  blog: "Blog (articles)",
  "legal.privacy": "Confidentialité",
  "legal.terms": "Conditions",
  contact: "Contact",
};
