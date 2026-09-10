"use client";

import { useEffect, useState } from "react";

/** Iframe de prévisualisation du brouillon (après enregistrement). */
export function LivePreviewPanel({
  href,
  refreshKey,
}: {
  href: string;
  refreshKey: string | number;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const widths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

  useEffect(() => {
    /* remount via key */
  }, [refreshKey]);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-ink-100 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">
          Aperçu live
        </p>
        <div className="ml-auto flex gap-1">
          {(
            [
              ["desktop", "Desktop"],
              ["tablet", "Tablette"],
              ["mobile", "Mobile"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                device === id
                  ? "bg-lagoon-600 text-white"
                  : "bg-ink-50 text-ink-700/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-lagoon-700"
        >
          Ouvrir ↗
        </a>
      </div>
      <p className="border-b border-ink-50 px-3 py-1.5 text-[11px] text-ink-700/50">
        Affiche le brouillon disque — enregistrez pour synchroniser.
      </p>
      <div className="flex justify-center bg-[#dfe6e4] p-3">
        <iframe
          key={String(refreshKey)}
          title="Aperçu site"
          src={href}
          className="h-[70vh] rounded-lg border border-ink-100 bg-white shadow-sm"
          style={{ width: widths[device], maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}
