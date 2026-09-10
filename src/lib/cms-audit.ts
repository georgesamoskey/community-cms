import { promises as fs } from "fs";
import path from "path";

const AUDIT_FILE = path.join(
  process.cwd(),
  "src/content/_site/audit.jsonl",
);

export type CmsAuditEntry = {
  at: string;
  action: "save_draft" | "publish" | "discard" | "media_upload" | "login_denied";
  actor: {
    mode: "keycloak" | "password" | "unknown";
    name?: string;
    email?: string;
    roles?: string[];
  };
  detail?: string;
};

export async function appendCmsAudit(
  entry: Omit<CmsAuditEntry, "at"> & { at?: string },
): Promise<void> {
  const line = JSON.stringify({
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  });
  await fs.mkdir(path.dirname(AUDIT_FILE), { recursive: true });
  await fs.appendFile(AUDIT_FILE, `${line}\n`, "utf8");
}

export async function readCmsAudit(limit = 50): Promise<CmsAuditEntry[]> {
  try {
    const raw = await fs.readFile(AUDIT_FILE, "utf8");
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const slice = lines.slice(-Math.max(1, Math.min(limit, 200)));
    const out: CmsAuditEntry[] = [];
    for (const line of slice.reverse()) {
      try {
        out.push(JSON.parse(line) as CmsAuditEntry);
      } catch {
        /* skip */
      }
    }
    return out;
  } catch {
    return [];
  }
}
