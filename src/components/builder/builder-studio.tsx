"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BLOCK_CATALOG,
  SECTION_TEMPLATES,
  createBlock,
  defaultPropsFor,
  uid,
} from "@/builder/defaults";
import type {
  BlockType,
  BlogPostDoc,
  ColumnsProps,
  NavItem,
  SiteBlock,
  SiteDocument,
  SitePage,
} from "@/builder/types";
import type { BlockStyle } from "@/builder/block-style";
import { ColumnsEditor } from "@/components/builder/columns-editor";
import { LivePreviewPanel } from "@/components/builder/live-preview-panel";
import { StylePanel } from "@/components/builder/style-panel";
import { VersionsPanel } from "@/components/builder/versions-panel";
import { publicPagePath } from "@/lib/site-path";
import type { CmsCapabilities } from "@/lib/cms-rbac";

const FIELD =
  "mt-1 w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-700/70";
const BTN =
  "rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50";

type Tab = "pages" | "nav" | "theme" | "blog" | "media" | "audit" | "versions";

function Field({
  label,
  value,
  onChange,
  multiline,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label className={LABEL}>
      {label}
      {multiline ? (
        <textarea
          className={FIELD}
          rows={rows ?? 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={FIELD}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function cloneDoc(doc: SiteDocument): SiteDocument {
  return JSON.parse(JSON.stringify(doc)) as SiteDocument;
}

export function BuilderStudio({
  capabilities,
}: {
  capabilities: CmsCapabilities;
}) {
  const [doc, setDoc] = useState<SiteDocument | null>(null);
  const [dirtyServer, setDirtyServer] = useState(false);
  const [localDirty, setLocalDirty] = useState(false);
  const [tab, setTab] = useState<Tab>("pages");
  const [pageId, setPageId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<"content" | "style">(
    "content",
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [libFilter, setLibFilter] = useState<string>("all");
  const [livePreview, setLivePreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/cms/site?mode=draft");
    if (!res.ok) throw new Error("load");
    const j = (await res.json()) as { doc: SiteDocument; dirty: boolean };
    setDoc(j.doc);
    setDirtyServer(j.dirty);
    setLocalDirty(false);
    setPageId((prev) => prev ?? j.doc.pages[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void load().catch(() => setStatus("Impossible de charger le site."));
  }, [load]);

  const page = useMemo(
    () => doc?.pages.find((p) => p.id === pageId) ?? null,
    [doc, pageId],
  );
  const selectedBlock = useMemo(
    () => page?.blocks.find((b) => b.id === blockId) ?? null,
    [page, blockId],
  );

  function updateDoc(mutator: (d: SiteDocument) => void) {
    if (!capabilities.canEdit && !capabilities.canManageTheme) return;
    setDoc((prev) => {
      if (!prev) return prev;
      const next = cloneDoc(prev);
      mutator(next);
      return next;
    });
    setLocalDirty(true);
  }

  async function saveDraft() {
    if (!doc) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/cms/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", doc }),
      });
      const j = (await res.json()) as {
        error?: string;
        doc?: SiteDocument;
        dirty?: boolean;
      };
      if (!res.ok) {
        setStatus(j.error ?? "Échec sauvegarde");
        return;
      }
      if (j.doc) setDoc(j.doc);
      setDirtyServer(!!j.dirty);
      setLocalDirty(false);
      setPreviewKey((k) => k + 1);
      setStatus("Brouillon enregistré");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setStatus(null);
    try {
      if (localDirty && doc) {
        await fetch("/api/cms/site", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", doc }),
        });
      }
      const res = await fetch("/api/cms/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const j = (await res.json()) as {
        error?: string;
        doc?: SiteDocument;
        versionId?: string;
        notify?: {
          webhook?: { ok: boolean };
          eagaseke?: { ok: boolean };
        };
      };
      if (!res.ok) {
        setStatus(j.error ?? "Échec publication");
        return;
      }
      if (j.doc) setDoc(j.doc);
      setDirtyServer(false);
      setLocalDirty(false);
      setPreviewKey((k) => k + 1);
      const bits = ["Site publié"];
      if (j.versionId) bits.push(j.versionId);
      if (j.notify?.eagaseke) {
        bits.push(j.notify.eagaseke.ok ? "ingest OK" : "ingest KO");
      }
      if (j.notify?.webhook) {
        bits.push(j.notify.webhook.ok ? "webhook OK" : "webhook KO");
      }
      setStatus(bits.join(" · "));
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!confirm("Revenir à la version publiée ? Les changements brouillon seront perdus."))
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/cms/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      });
      const j = (await res.json()) as { doc?: SiteDocument };
      if (j.doc) setDoc(j.doc);
      setDirtyServer(false);
      setLocalDirty(false);
      setStatus("Brouillon annulé");
    } finally {
      setBusy(false);
    }
  }

  function addPage() {
    if (!capabilities.canEdit) {
      setStatus("Permission cms.site.edit requise");
      return;
    }
    const slug = prompt("Slug de la page (ex: landing-demo)", "nouvelle-page");
    if (slug == null) return;
    const clean = slug
      .trim()
      .replace(/^\/+/, "")
      .replace(/[^a-zA-Z0-9/_-]/g, "-")
      .toLowerCase();
    updateDoc((d) => {
      if (d.pages.some((p) => p.slug === clean)) {
        setStatus("Slug déjà utilisé");
        return;
      }
      const p: SitePage = {
        id: uid("page"),
        slug: clean,
        title: clean || "Accueil",
        status: "draft",
        seo: { title: clean || "Accueil" },
        blocks: [
          {
            id: uid("b"),
            type: "richText",
            props: defaultPropsFor("richText") as Extract<
              SiteBlock,
              { type: "richText" }
            >["props"],
          },
        ],
      };
      d.pages.push(p);
      setPageId(p.id);
      setTab("pages");
    });
  }

  function addBlock(type: BlockType) {
    if (!capabilities.canEdit) {
      setStatus("Permission cms.site.edit requise");
      return;
    }
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      const block = createBlock(type);
      p.blocks.push(block);
      setBlockId(block.id);
      setInspectorTab("content");
    });
  }

  function insertTemplate(templateId: string) {
    if (!page) return;
    const tpl = SECTION_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      const created = tpl.blocks.map((b) => {
        const block = createBlock(b.type, {
          props: b.props,
          style: b.style,
          label: b.label,
        } as Partial<SiteBlock>);
        return block;
      });
      p.blocks.push(...created);
      setBlockId(created[0]?.id ?? null);
    });
  }

  function duplicateBlock(id: string) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      const i = p.blocks.findIndex((b) => b.id === id);
      if (i < 0) return;
      const copy = JSON.parse(JSON.stringify(p.blocks[i])) as SiteBlock;
      copy.id = uid("b");
      copy.label = `${copy.label || copy.type} (copie)`;
      p.blocks.splice(i + 1, 0, copy);
      setBlockId(copy.id);
    });
  }

  function toggleHidden(id: string) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      const b = p?.blocks.find((x) => x.id === id);
      if (b) b.hidden = !b.hidden;
    });
  }

  function onDropReorder(targetId: string) {
    if (!page || !dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      const from = p.blocks.findIndex((b) => b.id === dragId);
      const to = p.blocks.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return;
      const [item] = p.blocks.splice(from, 1);
      if (!item) return;
      p.blocks.splice(to, 0, item);
    });
    setDragId(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      const i = p.blocks.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.blocks.length) return;
      const tmp = p.blocks[i]!;
      p.blocks[i] = p.blocks[j]!;
      p.blocks[j] = tmp;
    });
  }

  function removeBlock(id: string) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      if (!p) return;
      p.blocks = p.blocks.filter((b) => b.id !== id);
      if (blockId === id) setBlockId(null);
    });
  }

  function updateBlockProps(id: string, props: SiteBlock["props"]) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      const b = p?.blocks.find((x) => x.id === id);
      if (b) b.props = props as never;
    });
  }

  function updateBlockStyle(id: string, style: BlockStyle) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      const b = p?.blocks.find((x) => x.id === id);
      if (b) b.style = style;
    });
  }

  function updateBlockMeta(
    id: string,
    patch: Partial<Pick<SiteBlock, "label" | "hidden">>,
  ) {
    if (!page) return;
    updateDoc((d) => {
      const p = d.pages.find((x) => x.id === page.id);
      const b = p?.blocks.find((x) => x.id === id);
      if (b) Object.assign(b, patch);
    });
  }

  async function uploadMedia(file: File) {
    if (!capabilities.canManageMedia) {
      setStatus("Permission cms.media.manage requise");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/cms/media", { method: "POST", body: fd });
      const j = (await res.json()) as {
        error?: string;
        media?: SiteDocument["media"];
      };
      if (!res.ok) {
        setStatus(j.error ?? "Upload échoué");
        return;
      }
      if (j.media && doc) {
        setDoc({ ...doc, media: j.media });
        setDirtyServer(true);
        setStatus("Média ajouté (brouillon)");
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!doc) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-700/70">
        Chargement du site builder…
      </div>
    );
  }

  const previewHref = page
    ? `${publicPagePath(page)}?preview=1`
    : "/?preview=1";

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f1] text-ink-900">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="font-display text-lg font-semibold">Site builder</p>
          <p className="text-xs text-ink-700/60">
            {doc.settings.brand} · {localDirty || dirtyServer ? "brouillon modifié" : "à jour"}
          </p>
        </div>
        <nav className="ml-2 flex flex-wrap gap-1">
          {(
            [
              ["pages", "Pages", true],
              ["nav", "Menus", capabilities.canEdit],
              ["theme", "Marque", capabilities.canManageTheme],
              ["blog", "Blog", capabilities.canEdit || capabilities.canRead],
              ["media", "Médias", capabilities.canManageMedia || capabilities.canRead],
              ["versions", "Versions", capabilities.canRead],
              ["audit", "Audit", capabilities.canRead],
            ] as const
          )
            .filter(([, , show]) => show)
            .map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cxTab(tab === id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {status && <span className="text-xs text-lagoon-700">{status}</span>}
          {!capabilities.canEdit && (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
              Lecture seule
            </span>
          )}
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className={`${BTN} border border-ink-100 bg-white`}
          >
            Prévisualiser
          </a>
          <button
            type="button"
            onClick={() => setLivePreview((v) => !v)}
            className={`${BTN} border border-ink-100 ${
              livePreview ? "bg-lagoon-50 text-lagoon-800" : "bg-white"
            }`}
          >
            {livePreview ? "Masquer aperçu" : "Aperçu live"}
          </button>
          <button
            type="button"
            disabled={busy || !capabilities.canEdit}
            onClick={() => void saveDraft()}
            className={`${BTN} border border-ink-100 bg-white`}
            title={!capabilities.canEdit ? "cms.site.edit requis" : undefined}
          >
            Enregistrer
          </button>
          <button
            type="button"
            disabled={busy || !capabilities.canPublish}
            onClick={() => void discard()}
            className={`${BTN} border border-ink-100 bg-white text-ink-700/70`}
            title={!capabilities.canPublish ? "cms.site.publish requis" : undefined}
          >
            Annuler brouillon
          </button>
          <button
            type="button"
            disabled={busy || !capabilities.canPublish}
            onClick={() => void publish()}
            className={`${BTN} bg-lagoon-600 text-white hover:bg-lagoon-700`}
            title={!capabilities.canPublish ? "cms.site.publish requis" : undefined}
          >
            Publier
          </button>
          <Link href="/" className={`${BTN} text-ink-700/70`}>
            ← Site
          </Link>
        </div>
      </header>

      {tab === "pages" && (
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-0 lg:grid-cols-[220px_1fr_320px]">
          <aside className="border-r border-ink-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">
                Pages
              </p>
              <button
                type="button"
                onClick={addPage}
                disabled={!capabilities.canEdit}
                className="text-xs font-semibold text-lagoon-700 disabled:opacity-40"
              >
                + Page
              </button>
            </div>
            <ul className="space-y-1">
              {doc.pages.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPageId(p.id);
                      setBlockId(null);
                    }}
                    className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                      p.id === pageId
                        ? "bg-lagoon-50 font-semibold text-lagoon-800"
                        : "hover:bg-ink-50"
                    }`}
                  >
                    <span className="block truncate">{p.title}</span>
                    <span className="block truncate text-[11px] text-ink-700/50">
                      /{p.slug || ""} · {p.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <main className="min-h-[70vh] p-4">
            {!page ? (
              <p className="text-sm text-ink-700/60">Sélectionnez une page.</p>
            ) : (
              <fieldset
                disabled={!capabilities.canEdit}
                className="min-w-0 border-0 p-0 disabled:opacity-90"
              >
                <div className="mb-4 grid gap-3 rounded-xl border border-ink-100 bg-white p-4 sm:grid-cols-2">
                  <Field
                    label="Titre studio"
                    value={page.title}
                    onChange={(v) =>
                      updateDoc((d) => {
                        const p = d.pages.find((x) => x.id === page.id);
                        if (p) p.title = v;
                      })
                    }
                  />
                  <Field
                    label="Slug URL"
                    value={page.slug}
                    onChange={(v) =>
                      updateDoc((d) => {
                        const p = d.pages.find((x) => x.id === page.id);
                        if (p) p.slug = v.replace(/^\/+/, "");
                      })
                    }
                  />
                  <Field
                    label="SEO title"
                    value={page.seo.title ?? ""}
                    onChange={(v) =>
                      updateDoc((d) => {
                        const p = d.pages.find((x) => x.id === page.id);
                        if (p) p.seo.title = v;
                      })
                    }
                  />
                  <Field
                    label="SEO description"
                    value={page.seo.description ?? ""}
                    onChange={(v) =>
                      updateDoc((d) => {
                        const p = d.pages.find((x) => x.id === page.id);
                        if (p) p.seo.description = v;
                      })
                    }
                  />
                  <label className={`${LABEL} flex items-center gap-2`}>
                    Statut
                    <select
                      className={FIELD}
                      value={page.status}
                      onChange={(e) =>
                        updateDoc((d) => {
                          const p = d.pages.find((x) => x.id === page.id);
                          if (p)
                            p.status = e.target.value as SitePage["status"];
                        })
                      }
                    >
                      <option value="published">published</option>
                      <option value="draft">draft</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!page.seo.noIndex}
                      onChange={(e) =>
                        updateDoc((d) => {
                          const p = d.pages.find((x) => x.id === page.id);
                          if (p) p.seo.noIndex = e.target.checked;
                        })
                      }
                    />
                    noIndex
                  </label>
                </div>

                <div className="space-y-3">
                  {page.blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={() => setDragId(block.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropReorder(block.id)}
                      onClick={() => {
                        setBlockId(block.id);
                        setInspectorTab("content");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setBlockId(block.id);
                      }}
                      className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                        block.id === blockId
                          ? "border-lagoon-500 ring-2 ring-lagoon-500/20"
                          : "border-ink-100 hover:border-lagoon-300"
                      } ${block.hidden ? "opacity-50" : ""} ${
                        dragId === block.id ? "opacity-60" : ""
                      }`}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="cursor-grab text-ink-700/30" title="Glisser">
                          ⠿
                        </span>
                        <span className="rounded-md bg-ink-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                          {block.label ||
                            BLOCK_CATALOG.find((c) => c.type === block.type)
                              ?.label ||
                            block.type}
                        </span>
                        {block.hidden && (
                          <span className="text-[10px] text-amber-700">masqué</span>
                        )}
                        <span className="text-xs text-ink-700/40">#{idx + 1}</span>
                        <div className="ml-auto flex gap-1">
                          <button
                            type="button"
                            className="rounded px-2 text-xs hover:bg-ink-50"
                            title="Dupliquer"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                          >
                            Dupl.
                          </button>
                          <button
                            type="button"
                            className="rounded px-2 text-xs hover:bg-ink-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHidden(block.id);
                            }}
                          >
                            {block.hidden ? "Afficher" : "Masquer"}
                          </button>
                          <button
                            type="button"
                            className="rounded px-2 text-xs hover:bg-ink-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, -1);
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded px-2 text-xs hover:bg-ink-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(block.id, 1);
                            }}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="rounded px-2 text-xs text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(block.id);
                            }}
                          >
                            Suppr.
                          </button>
                        </div>
                      </div>
                      <BlockPreview block={block} />
                    </div>
                  ))}
                </div>
                {livePreview && (
                  <LivePreviewPanel href={previewHref} refreshKey={previewKey} />
                )}
              </fieldset>
            )}
          </main>

          <aside className="border-l border-ink-100 bg-white p-3">
            {capabilities.canEdit && (
            <button
              type="button"
              className="mb-3 w-full rounded-lg border border-dashed border-lagoon-400 py-2 text-sm font-semibold text-lagoon-700"
              onClick={() => setLibraryOpen((v) => !v)}
            >
              {libraryOpen ? "Masquer" : "Afficher"} bibliothèque
            </button>
            )}
            {capabilities.canEdit && libraryOpen && (
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["all", "Tous"],
                      ["layout", "Layout"],
                      ["content", "Contenu"],
                      ["media", "Média"],
                      ["conversion", "Conv."],
                      ["data", "Data"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLibFilter(id)}
                      className={`rounded-md px-2 py-0.5 text-[11px] ${
                        libFilter === id
                          ? "bg-lagoon-600 text-white"
                          : "bg-ink-50 text-ink-700/70"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid max-h-40 gap-1 overflow-y-auto">
                  {BLOCK_CATALOG.filter(
                    (c) => libFilter === "all" || c.group === libFilter,
                  ).map((c) => (
                    <button
                      key={c.type}
                      type="button"
                      disabled={!page}
                      onClick={() => addBlock(c.type)}
                      className="rounded-lg px-2 py-1.5 text-left text-sm hover:bg-lagoon-50 disabled:opacity-40"
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="block text-[11px] text-ink-700/50">
                        {c.description}
                      </span>
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase text-ink-700/50">
                    Templates section
                  </p>
                  <div className="grid max-h-28 gap-1 overflow-y-auto">
                    {SECTION_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!page}
                        onClick={() => insertTemplate(t.id)}
                        className="rounded-lg border border-ink-50 px-2 py-1.5 text-left text-xs hover:border-lagoon-300 hover:bg-lagoon-50/50 disabled:opacity-40"
                      >
                        <span className="font-semibold">{t.name}</span>
                        <span className="block text-ink-700/50">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                className={cxTab(inspectorTab === "content")}
                onClick={() => setInspectorTab("content")}
              >
                Contenu
              </button>
              <button
                type="button"
                className={cxTab(inspectorTab === "style")}
                onClick={() => setInspectorTab("style")}
              >
                Style
              </button>
            </div>
            {selectedBlock ? (
              inspectorTab === "style" ? (
                <fieldset disabled={!capabilities.canEdit} className="min-w-0 border-0 p-0">
                <StylePanel
                  style={selectedBlock.style}
                  onChange={(style) =>
                    updateBlockStyle(selectedBlock.id, style)
                  }
                />
                </fieldset>
              ) : (
                <fieldset disabled={!capabilities.canEdit} className="min-w-0 border-0 p-0">
                <BlockInspector
                  block={selectedBlock}
                  media={doc.media}
                  onChange={(props) =>
                    updateBlockProps(selectedBlock.id, props)
                  }
                  onMeta={(patch) => updateBlockMeta(selectedBlock.id, patch)}
                />
                </fieldset>
              )
            ) : (
              <p className="text-sm text-ink-700/50">
                Sélectionnez un bloc sur le canvas.
              </p>
            )}
            {page && capabilities.canEdit && (
              <button
                type="button"
                className="mt-6 w-full rounded-lg border border-red-200 py-2 text-sm text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (page.slug === "") {
                    setStatus("Impossible de supprimer l’accueil");
                    return;
                  }
                  if (!confirm(`Supprimer la page « ${page.title} » ?`)) return;
                  updateDoc((d) => {
                    d.pages = d.pages.filter((p) => p.id !== page.id);
                  });
                  setPageId(doc.pages.find((p) => p.id !== page.id)?.id ?? null);
                }}
              >
                Supprimer la page
              </button>
            )}
          </aside>
        </div>
      )}

      {tab === "blog" && (
        <fieldset disabled={!capabilities.canEdit} className="min-w-0 border-0 p-0">
        <BlogEditor
          posts={doc.blog}
          onChange={(posts) =>
            updateDoc((d) => {
              d.blog = posts;
            })
          }
        />
        </fieldset>
      )}
      {tab === "nav" && (
        <fieldset disabled={!capabilities.canEdit} className="min-w-0 border-0 p-0">
        <NavEditors
          doc={doc}
          onChange={(mut) => updateDoc(mut)}
        />
        </fieldset>
      )}
      {tab === "theme" && (
        <ThemeEditor doc={doc} onChange={(mut) => updateDoc(mut)} />
      )}
      {tab === "media" && (
        <MediaPanel
          media={doc.media}
          onUpload={(f) => void uploadMedia(f)}
          busy={busy}
          canUpload={capabilities.canManageMedia}
        />
      )}
      {tab === "versions" && (
        <VersionsPanel
          capabilities={capabilities}
          onRestored={(restored) => {
            setDoc(restored);
            setDirtyServer(true);
            setLocalDirty(false);
            setPreviewKey((k) => k + 1);
          }}
        />
      )}
      {tab === "audit" && <AuditPanel />}
    </div>
  );
}

function cxTab(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium ${
    active ? "bg-lagoon-600 text-white" : "text-ink-700/80 hover:bg-ink-50"
  }`;
}

function BlockPreview({ block }: { block: SiteBlock }) {
  const p = block.props as Record<string, unknown>;
  if (block.type === "hero") {
    return (
      <div>
        <p className="font-display text-xl font-semibold">{String(p.brand ?? "")}</p>
        <p className="text-sm text-ink-700/70">{String(p.headline ?? "")}</p>
      </div>
    );
  }
  if ("title" in p && typeof p.title === "string") {
    return <p className="font-medium">{p.title}</p>;
  }
  return (
    <p className="text-xs text-ink-700/50">{JSON.stringify(p).slice(0, 120)}…</p>
  );
}

function BlockInspector({
  block,
  media,
  onChange,
  onMeta,
}: {
  block: SiteBlock;
  media: SiteDocument["media"];
  onChange: (props: SiteBlock["props"]) => void;
  onMeta: (patch: Partial<Pick<SiteBlock, "label" | "hidden">>) => void;
}) {
  const props = block.props as Record<string, unknown>;

  function set(key: string, value: unknown) {
    onChange({ ...props, [key]: value } as SiteBlock["props"]);
  }

  function setNested(key: string, nestedKey: string, value: string) {
    const obj = (props[key] as Record<string, string>) ?? {};
    set(key, { ...obj, [nestedKey]: value });
  }

  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
      <p className="text-sm font-semibold">{block.type}</p>
      <Field
        label="Nom studio"
        value={block.label ?? ""}
        onChange={(v) => onMeta({ label: v || undefined })}
      />
      {block.type === "columns" && (
        <ColumnsEditor
          value={props as ColumnsProps}
          media={media}
          onChange={(next) => onChange(next)}
        />
      )}
      {block.type !== "columns" && (
        <>
      {/* Variantes fréquentes */}
      {"variant" in props && (
        <label className={LABEL}>
          Variante
          <select
            className={FIELD}
            value={String(props.variant ?? "")}
            onChange={(e) => set("variant", e.target.value)}
          >
            {variantOptions(block.type).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      )}
      {"tone" in props && (
        <label className={LABEL}>
          Tone
          <select
            className={FIELD}
            value={String(props.tone ?? "dark")}
            onChange={(e) => set("tone", e.target.value)}
          >
            {["dark", "light", "image"].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      )}
      {"minHeight" in props && (
        <label className={LABEL}>
          Hauteur hero
          <select
            className={FIELD}
            value={String(props.minHeight ?? "lg")}
            onChange={(e) => set("minHeight", e.target.value)}
          >
            {["sm", "md", "lg", "screen"].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      )}
      {"columns" in props && typeof props.columns === "number" && (
        <label className={LABEL}>
          Colonnes grille
          <select
            className={FIELD}
            value={String(props.columns)}
            onChange={(e) => set("columns", Number(e.target.value))}
          >
            {[2, 3, 4].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      )}
      {Object.entries(props).map(([key, val]) => {
        if (
          key === "variant" ||
          key === "tone" ||
          key === "minHeight" ||
          (key === "columns" && typeof val === "number")
        ) {
          return null;
        }
        if (typeof val === "string" || typeof val === "number") {
          if (key === "src" || key === "mediaUrl" || key === "poster" || key === "avatar") {
            return (
              <div key={key} className="space-y-1">
                <Field
                  label={key}
                  value={String(val)}
                  onChange={(v) => set(key, v)}
                />
                {media.length > 0 && (
                  <select
                    className={FIELD}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) set(key, e.target.value);
                    }}
                  >
                    <option value="">Choisir un média…</option>
                    {media.map((m) => (
                      <option key={m.id} value={m.url}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          }
          if (
            key === "html" ||
            key === "support" ||
            key === "intro" ||
            key === "body" ||
            key === "note" ||
            key === "footnote" ||
            key === "quote"
          ) {
            return (
              <Field
                key={key}
                label={key}
                value={String(val)}
                multiline
                onChange={(v) => set(key, v)}
              />
            );
          }
          return (
            <Field
              key={key}
              label={key}
              value={String(val)}
              onChange={(v) =>
                set(key, typeof val === "number" ? Number(v) || 0 : v)
              }
            />
          );
        }
        if (typeof val === "boolean") {
          return (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => set(key, e.target.checked)}
              />
              {key}
            </label>
          );
        }
        if (
          val &&
          typeof val === "object" &&
          !Array.isArray(val) &&
          ("label" in (val as object) || "href" in (val as object))
        ) {
          const o = val as { label?: string; href?: string };
          return (
            <div key={key} className="space-y-2 rounded-lg border border-ink-50 p-2">
              <p className="text-[11px] font-semibold uppercase text-ink-700/50">
                {key}
              </p>
              <Field
                label="label"
                value={o.label ?? ""}
                onChange={(v) => setNested(key, "label", v)}
              />
              <Field
                label="href"
                value={o.href ?? ""}
                onChange={(v) => setNested(key, "href", v)}
              />
            </div>
          );
        }
        if (Array.isArray(val)) {
          return (
            <ArrayEditor
              key={key}
              label={key}
              value={val}
              onChange={(next) => set(key, next)}
            />
          );
        }
        return (
          <Field
            key={key}
            label={key}
            value={JSON.stringify(val)}
            multiline
            onChange={(v) => {
              try {
                set(key, JSON.parse(v));
              } catch {
                /* ignore */
              }
            }}
          />
        );
      })}
        </>
      )}
    </div>
  );
}

function variantOptions(type: BlockType): string[] {
  switch (type) {
    case "hero":
      return ["classic", "split", "minimal", "centered"];
    case "richText":
      return ["article", "lead", "compact"];
    case "featureGrid":
      return ["cards", "minimal", "bordered"];
    case "ctaBand":
      return ["gradient", "solid", "outline", "soft"];
    case "faq":
      return ["accordion", "split"];
    case "stats":
      return ["plain", "cards", "inline"];
    case "blogList":
      return ["grid", "list"];
    case "quote":
      return ["large", "card"];
    case "testimonials":
      return ["cards", "carousel"];
    default:
      return [];
  }
}

function ArrayEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown[];
  onChange: (v: unknown[]) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-ink-50 p-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase text-ink-700/50">
          {label} ({value.length})
        </p>
        <button
          type="button"
          className="text-xs font-semibold text-lagoon-700"
          onClick={() => {
            const sample = value[0];
            if (typeof sample === "string") onChange([...value, ""]);
            else if (sample && typeof sample === "object")
              onChange([...value, { ...(sample as object) }]);
            else onChange([...value, {}]);
          }}
        >
          + item
        </button>
      </div>
      {value.map((item, i) => (
        <div key={i} className="relative rounded border border-ink-50 bg-ink-50/40 p-2">
          <button
            type="button"
            className="absolute right-1 top-1 text-[10px] text-red-600"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ×
          </button>
          {typeof item === "string" ? (
            <textarea
              className={FIELD}
              rows={2}
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          ) : item && typeof item === "object" ? (
            <div className="space-y-1">
              {Object.entries(item as Record<string, unknown>).map(([k, v]) => {
                if (Array.isArray(v)) {
                  return (
                    <Field
                      key={k}
                      label={k}
                      value={(v as string[]).join("\n")}
                      multiline
                      onChange={(raw) => {
                        const next = [...value] as Record<string, unknown>[];
                        next[i] = {
                          ...(item as object),
                          [k]: raw.split("\n").filter(Boolean),
                        };
                        onChange(next);
                      }}
                    />
                  );
                }
                if (typeof v === "boolean") {
                  return (
                    <label key={k} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={v}
                        onChange={(e) => {
                          const next = [...value] as Record<string, unknown>[];
                          next[i] = { ...(item as object), [k]: e.target.checked };
                          onChange(next);
                        }}
                      />
                      {k}
                    </label>
                  );
                }
                return (
                  <Field
                    key={k}
                    label={k}
                    value={String(v ?? "")}
                    multiline={String(v ?? "").length > 60}
                    onChange={(raw) => {
                      const next = [...value] as Record<string, unknown>[];
                      next[i] = { ...(item as object), [k]: raw };
                      onChange(next);
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-xs">item</p>
          )}
        </div>
      ))}
    </div>
  );
}

function NavEditors({
  doc,
  onChange,
}: {
  doc: SiteDocument;
  onChange: (mut: (d: SiteDocument) => void) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 p-6 lg:grid-cols-2">
      <NavList
        title="Navigation header"
        items={doc.nav}
        onChange={(items) => onChange((d) => { d.nav = items; })}
      />
      <div className="space-y-4">
        <Field
          label="Texte footer"
          value={doc.footer.blurb}
          multiline
          onChange={(v) => onChange((d) => { d.footer.blurb = v; })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={doc.footer.showStudioLink}
            onChange={(e) =>
              onChange((d) => {
                d.footer.showStudioLink = e.target.checked;
              })
            }
          />
          Afficher le lien studio
        </label>
        <NavList
          title="Liens footer"
          items={doc.footer.links}
          onChange={(items) => onChange((d) => { d.footer.links = items; })}
        />
      </div>
    </div>
  );
}

function NavList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <button
          type="button"
          className="text-sm font-semibold text-lagoon-700"
          onClick={() =>
            onChange([
              ...items,
              { id: uid("nav"), label: "Nouveau", href: "/" },
            ])
          }
        >
          + Lien
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="grid gap-2 rounded-lg border border-ink-50 p-2 sm:grid-cols-2">
            <Field
              label="Label"
              value={item.label}
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...item, label: v };
                onChange(next);
              }}
            />
            <Field
              label="Href"
              value={item.href}
              onChange={(v) => {
                const next = [...items];
                next[i] = { ...item, href: v };
                onChange(next);
              }}
            />
            <label className="flex items-center gap-2 text-xs sm:col-span-2">
              <input
                type="checkbox"
                checked={!!item.external}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, external: e.target.checked };
                  onChange(next);
                }}
              />
              Lien externe
              <button
                type="button"
                className="ml-auto text-red-600"
                onClick={() => onChange(items.filter((x) => x.id !== item.id))}
              >
                Supprimer
              </button>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThemeEditor({
  doc,
  onChange,
}: {
  doc: SiteDocument;
  onChange: (mut: (d: SiteDocument) => void) => void;
}) {
  const s = doc.settings;
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="rounded-xl border border-ink-100 bg-white p-4 space-y-3">
        <Field
          label="Marque"
          value={s.brand}
          onChange={(v) => onChange((d) => { d.settings.brand = v; })}
        />
        <Field
          label="Tagline"
          value={s.tagline}
          onChange={(v) => onChange((d) => { d.settings.tagline = v; })}
        />
        <Field
          label="Logo URL"
          value={s.logoUrl ?? ""}
          onChange={(v) => onChange((d) => { d.settings.logoUrl = v || undefined; })}
        />
        <Field
          label="CTA label"
          value={s.primaryCta.label}
          onChange={(v) =>
            onChange((d) => {
              d.settings.primaryCta.label = v;
            })
          }
        />
        <Field
          label="CTA href ({{portal}} OK)"
          value={s.primaryCta.href}
          onChange={(v) =>
            onChange((d) => {
              d.settings.primaryCta.href = v;
            })
          }
        />
        {(
          [
            ["accent", "Accent"],
            ["sun", "Soleil"],
            ["background", "Fond"],
            ["foreground", "Texte"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={LABEL}>
            {label}
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                className="h-10 w-14 cursor-pointer rounded border border-ink-100"
                value={s.theme[key]}
                onChange={(e) =>
                  onChange((d) => {
                    d.settings.theme[key] = e.target.value;
                  })
                }
              />
              <input
                className={FIELD}
                value={s.theme[key]}
                onChange={(e) =>
                  onChange((d) => {
                    d.settings.theme[key] = e.target.value;
                  })
                }
              />
            </div>
          </label>
        ))}
        <Field
          label="CSS global du site"
          value={s.customCss ?? ""}
          multiline
          rows={6}
          onChange={(v) =>
            onChange((d) => {
              d.settings.customCss = v || undefined;
            })
          }
        />
      </div>
      <div className="rounded-xl border border-ink-100 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold">i18n (chrome)</p>
        <p className="text-xs text-ink-700/60">
          Locales + surcharges nav/footer/marque. Public :{" "}
          <code>?lang=en</code>
        </p>
        <Field
          label="Locales (CSV)"
          value={(s.i18n?.locales ?? ["fr"]).join(",")}
          onChange={(v) =>
            onChange((d) => {
              const locales = v
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
              const defaultLocale =
                d.settings.i18n?.defaultLocale &&
                locales.includes(d.settings.i18n.defaultLocale)
                  ? d.settings.i18n.defaultLocale
                  : locales[0] || "fr";
              d.settings.i18n = { defaultLocale, locales: locales.length ? locales : ["fr"] };
            })
          }
        />
        <Field
          label="Locale par défaut"
          value={s.i18n?.defaultLocale ?? "fr"}
          onChange={(v) =>
            onChange((d) => {
              const locales = d.settings.i18n?.locales ?? ["fr"];
              d.settings.i18n = {
                defaultLocale: v || "fr",
                locales: locales.includes(v) ? locales : [...locales, v],
              };
            })
          }
        />
        {(s.i18n?.locales ?? [])
          .filter((loc) => loc !== (s.i18n?.defaultLocale ?? "fr"))
          .map((loc) => {
            const o = doc.localeOverlays?.[loc];
            return (
              <div
                key={loc}
                className="space-y-2 rounded-lg border border-ink-50 p-3"
              >
                <p className="text-xs font-semibold uppercase text-ink-700/50">
                  Overlay {loc}
                </p>
                <Field
                  label="Marque"
                  value={o?.settings?.brand ?? ""}
                  onChange={(v) =>
                    onChange((d) => {
                      d.localeOverlays = d.localeOverlays ?? {};
                      const cur = d.localeOverlays[loc] ?? {};
                      d.localeOverlays[loc] = {
                        ...cur,
                        settings: { ...cur.settings, brand: v || undefined },
                      };
                    })
                  }
                />
                <Field
                  label="Tagline"
                  value={o?.settings?.tagline ?? ""}
                  onChange={(v) =>
                    onChange((d) => {
                      d.localeOverlays = d.localeOverlays ?? {};
                      const cur = d.localeOverlays[loc] ?? {};
                      d.localeOverlays[loc] = {
                        ...cur,
                        settings: { ...cur.settings, tagline: v || undefined },
                      };
                    })
                  }
                />
                <Field
                  label="CTA label"
                  value={o?.settings?.primaryCta?.label ?? ""}
                  onChange={(v) =>
                    onChange((d) => {
                      d.localeOverlays = d.localeOverlays ?? {};
                      const cur = d.localeOverlays[loc] ?? {};
                      const cta = cur.settings?.primaryCta ?? {
                        label: "",
                        href: "{{portal}}/login",
                      };
                      d.localeOverlays[loc] = {
                        ...cur,
                        settings: {
                          ...cur.settings,
                          primaryCta: { ...cta, label: v },
                        },
                      };
                    })
                  }
                />
                <Field
                  label="Footer blurb"
                  value={o?.footer?.blurb ?? ""}
                  multiline
                  onChange={(v) =>
                    onChange((d) => {
                      d.localeOverlays = d.localeOverlays ?? {};
                      const cur = d.localeOverlays[loc] ?? {};
                      d.localeOverlays[loc] = {
                        ...cur,
                        footer: { ...cur.footer, blurb: v || undefined },
                      };
                    })
                  }
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

function BlogEditor({
  posts,
  onChange,
}: {
  posts: BlogPostDoc[];
  onChange: (posts: BlogPostDoc[]) => void;
}) {
  const [sel, setSel] = useState<string | null>(posts[0]?.id ?? null);
  const post = posts.find((p) => p.id === sel) ?? null;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 p-6 lg:grid-cols-[240px_1fr]">
      <div className="rounded-xl border border-ink-100 bg-white p-3">
        <button
          type="button"
          className="mb-2 w-full rounded-lg bg-lagoon-50 py-2 text-sm font-semibold text-lagoon-800"
          onClick={() => {
            const p: BlogPostDoc = {
              id: uid("post"),
              slug: `article-${Date.now().toString(36)}`,
              title: "Nouvel article",
              date: new Date().toISOString().slice(0, 10),
              excerpt: "",
              body: [""],
              status: "draft",
            };
            onChange([p, ...posts]);
            setSel(p.id);
          }}
        >
          + Article
        </button>
        <ul className="space-y-1">
          {posts.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSel(p.id)}
                className={`w-full rounded-lg px-2 py-2 text-left text-sm ${
                  p.id === sel ? "bg-lagoon-50 font-semibold" : "hover:bg-ink-50"
                }`}
              >
                {p.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {post && (
        <div className="space-y-3 rounded-xl border border-ink-100 bg-white p-4">
          <Field
            label="Titre"
            value={post.title}
            onChange={(v) =>
              onChange(posts.map((p) => (p.id === post.id ? { ...p, title: v } : p)))
            }
          />
          <Field
            label="Slug"
            value={post.slug}
            onChange={(v) =>
              onChange(posts.map((p) => (p.id === post.id ? { ...p, slug: v } : p)))
            }
          />
          <Field
            label="Date"
            value={post.date}
            onChange={(v) =>
              onChange(posts.map((p) => (p.id === post.id ? { ...p, date: v } : p)))
            }
          />
          <Field
            label="Extrait"
            value={post.excerpt}
            multiline
            onChange={(v) =>
              onChange(
                posts.map((p) => (p.id === post.id ? { ...p, excerpt: v } : p)),
              )
            }
          />
          <Field
            label="Corps (1 paragraphe / ligne)"
            value={post.body.join("\n")}
            multiline
            rows={8}
            onChange={(v) =>
              onChange(
                posts.map((p) =>
                  p.id === post.id
                    ? { ...p, body: v.split("\n").filter((x) => x.length) }
                    : p,
                ),
              )
            }
          />
          <select
            className={FIELD}
            value={post.status}
            onChange={(e) =>
              onChange(
                posts.map((p) =>
                  p.id === post.id
                    ? { ...p, status: e.target.value as BlogPostDoc["status"] }
                    : p,
                ),
              )
            }
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
          <button
            type="button"
            className="text-sm text-red-700"
            onClick={() => {
              onChange(posts.filter((p) => p.id !== post.id));
              setSel(null);
            }}
          >
            Supprimer l’article
          </button>
        </div>
      )}
    </div>
  );
}

function MediaPanel({
  media,
  onUpload,
  busy,
  canUpload = true,
}: {
  media: SiteDocument["media"];
  onUpload: (f: File) => void;
  busy: boolean;
  canUpload?: boolean;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      {canUpload ? (
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-lagoon-400 bg-white px-6 py-10">
        <span className="font-semibold text-lagoon-800">Déposer une image / PDF</span>
        <span className="mt-1 text-xs text-ink-700/50">Max 4 Mo</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
      </label>
      ) : (
        <p className="rounded-xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-700/70">
          Lecture seule — permission <code>cms.media.manage</code> requise pour uploader.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {media.map((m) => (
          <div
            key={m.id}
            className="overflow-hidden rounded-xl border border-ink-100 bg-white"
          >
            {m.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.name} className="h-32 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-ink-700/50">
                PDF
              </div>
            )}
            <div className="p-2 text-xs">
              <p className="truncate font-medium">{m.name}</p>
              <p className="truncate text-ink-700/50">{m.url}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditPanel() {
  const [entries, setEntries] = useState<
    Array<{
      at: string;
      action: string;
      actor: { name?: string; email?: string; mode?: string; roles?: string[] };
      detail?: string;
    }>
  >([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/cms/audit?limit=40")
      .then(async (r) => {
        const j = (await r.json()) as {
          entries?: typeof entries;
          error?: string;
        };
        if (!r.ok) {
          setErr(j.error ?? "Erreur");
          return;
        }
        setEntries(j.entries ?? []);
      })
      .catch(() => setErr("Impossible de charger l’audit"));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-3 p-6">
      <h2 className="font-display text-xl font-semibold">Journal CMS</h2>
      <p className="text-sm text-ink-700/60">
        Sauvegardes, publications, uploads (fichier local audit.jsonl).
      </p>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <ul className="divide-y divide-ink-50 rounded-xl border border-ink-100 bg-white">
        {entries.length === 0 && !err && (
          <li className="px-4 py-6 text-sm text-ink-700/50">Aucune entrée.</li>
        )}
        {entries.map((e, i) => (
          <li key={`${e.at}-${i}`} className="px-4 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-lagoon-800">{e.action}</span>
              <span className="text-xs text-ink-700/50">
                {new Date(e.at).toLocaleString("fr-FR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-700/70">
              {e.actor.name || e.actor.email || e.actor.mode || "—"}
              {e.actor.roles?.length
                ? ` · ${e.actor.roles.filter((r) => !r.startsWith("default-")).join(", ")}`
                : ""}
            </p>
            {e.detail && (
              <p className="mt-0.5 text-xs text-ink-700/50">{e.detail}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
