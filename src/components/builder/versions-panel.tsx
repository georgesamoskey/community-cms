"use client";

import { useCallback, useEffect, useState } from "react";
import type { SiteDocument } from "@/builder/types";
import type { CmsCapabilities } from "@/lib/cms-rbac";

type VersionMeta = {
  id: string;
  createdAt: string;
  label?: string;
  actor?: string;
  pages: number;
};

const BTN =
  "rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50";

export function VersionsPanel({
  capabilities,
  onRestored,
}: {
  capabilities: CmsCapabilities;
  onRestored: (doc: SiteDocument) => void;
}) {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/cms/versions");
    if (!res.ok) {
      setStatus("Impossible de charger l’historique");
      return;
    }
    const j = (await res.json()) as { versions: VersionMeta[] };
    setVersions(j.versions);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(
    versionId: string,
    action: "restore_draft" | "restore_publish",
  ) {
    const msg =
      action === "restore_publish"
        ? "Restaurer cette version et la republier en live ?"
        : "Restaurer cette version dans le brouillon ?";
    if (!confirm(msg)) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/cms/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, versionId }),
      });
      const j = (await res.json()) as {
        error?: string;
        doc?: SiteDocument;
      };
      if (!res.ok || !j.doc) {
        setStatus(j.error ?? "Restauration échouée");
        return;
      }
      onRestored(j.doc);
      setStatus(
        action === "restore_publish"
          ? "Version restaurée et publiée"
          : "Version restaurée en brouillon",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">Versions</h2>
          <p className="text-sm text-ink-700/60">
            Snapshots créés à chaque publication (max 30).
          </p>
        </div>
        <button
          type="button"
          className={`${BTN} border border-ink-100 bg-white`}
          disabled={busy}
          onClick={() => void load()}
        >
          Rafraîchir
        </button>
      </div>
      {status && <p className="text-sm text-lagoon-700">{status}</p>}
      {versions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-100 bg-white p-8 text-center text-sm text-ink-700/60">
          Aucune version — publiez une première fois pour créer un snapshot.
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-ink-700/50">{v.id}</p>
                <p className="text-sm font-medium">
                  {new Date(v.createdAt).toLocaleString("fr-FR")}
                  {v.label ? ` · ${v.label}` : ""}
                </p>
                <p className="text-xs text-ink-700/60">
                  {v.pages} page(s)
                  {v.actor ? ` · ${v.actor}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy || !capabilities.canEdit}
                className={`${BTN} border border-ink-100 bg-white`}
                onClick={() => void restore(v.id, "restore_draft")}
              >
                → Brouillon
              </button>
              <button
                type="button"
                disabled={busy || !capabilities.canPublish}
                className={`${BTN} bg-lagoon-600 text-white hover:bg-lagoon-700`}
                onClick={() => void restore(v.id, "restore_publish")}
              >
                Republier
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
