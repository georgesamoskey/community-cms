"use client";

import { createBlock, uid } from "@/builder/defaults";
import type { ColumnsProps, SiteBlock, SiteDocument } from "@/builder/types";

const FIELD =
  "mt-1 w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20";
const LABEL =
  "block text-xs font-semibold uppercase tracking-wide text-ink-700/70";

const SPANS: ColumnsProps["columns"][number]["span"][] = [3, 4, 6, 8, 9, 12];

/** Éditeur nested des colonnes (blocs enfants). */
export function ColumnsEditor({
  value,
  media: _media,
  onChange,
}: {
  value: ColumnsProps;
  media: SiteDocument["media"];
  onChange: (next: ColumnsProps) => void;
}) {
  void _media;

  function patchCol(
    colId: string,
    mut: (col: ColumnsProps["columns"][number]) => void,
  ) {
    const columns = value.columns.map((c) => {
      if (c.id !== colId) return c;
      const next = { ...c, blocks: [...c.blocks] };
      mut(next);
      return next;
    });
    onChange({ ...value, columns });
  }

  return (
    <div className="space-y-4">
      <label className={LABEL}>
        Écart
        <select
          className={FIELD}
          value={value.gap ?? "md"}
          onChange={(e) =>
            onChange({
              ...value,
              gap: e.target.value as ColumnsProps["gap"],
            })
          }
        >
          {(["sm", "md", "lg"] as const).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.stackOnMobile !== false}
          onChange={(e) =>
            onChange({ ...value, stackOnMobile: e.target.checked })
          }
        />
        Empiler sur mobile
      </label>

      <div className="space-y-3">
        {value.columns.map((col, idx) => (
          <div
            key={col.id}
            className="rounded-lg border border-ink-100 bg-ink-50/40 p-3"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-ink-700/60">
                Colonne {idx + 1}
              </p>
              <label className="flex items-center gap-1 text-xs">
                span
                <select
                  className="rounded border border-ink-100 px-1 py-0.5"
                  value={col.span}
                  onChange={(e) =>
                    patchCol(col.id, (c) => {
                      c.span = Number(e.target.value) as typeof c.span;
                    })
                  }
                >
                  {SPANS.map((s) => (
                    <option key={s} value={s}>
                      {s}/12
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="ml-auto text-xs font-semibold text-red-700"
                disabled={value.columns.length <= 1}
                onClick={() =>
                  onChange({
                    ...value,
                    columns: value.columns.filter((c) => c.id !== col.id),
                  })
                }
              >
                Retirer
              </button>
            </div>
            <ul className="space-y-2">
              {col.blocks.map((b, bi) => (
                <li
                  key={b.id}
                  className="rounded-md border border-ink-100 bg-white px-2 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.type}</span>
                    <span className="truncate text-xs text-ink-700/50">
                      {blockHint(b)}
                    </span>
                    <button
                      type="button"
                      className="ml-auto text-[11px] text-ink-700/60"
                      disabled={bi === 0}
                      onClick={() =>
                        patchCol(col.id, (c) => {
                          const arr = [...c.blocks];
                          [arr[bi - 1], arr[bi]] = [arr[bi], arr[bi - 1]];
                          c.blocks = arr;
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-[11px] text-ink-700/60"
                      disabled={bi === col.blocks.length - 1}
                      onClick={() =>
                        patchCol(col.id, (c) => {
                          const arr = [...c.blocks];
                          [arr[bi], arr[bi + 1]] = [arr[bi + 1], arr[bi]];
                          c.blocks = arr;
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-red-700"
                      onClick={() =>
                        patchCol(col.id, (c) => {
                          c.blocks = c.blocks.filter((x) => x.id !== b.id);
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                  <NestedBlockFields
                    block={b}
                    onChange={(next) =>
                      patchCol(col.id, (c) => {
                        c.blocks = c.blocks.map((x) =>
                          x.id === b.id ? next : x,
                        );
                      })
                    }
                  />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  "richText",
                  "quote",
                  "image",
                  "buttons",
                  "ctaBand",
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-lagoon-800 shadow-sm"
                  onClick={() =>
                    patchCol(col.id, (c) => {
                      c.blocks.push(createBlock(t));
                    })
                  }
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="w-full rounded-lg border border-dashed border-ink-200 py-2 text-sm font-semibold text-lagoon-800"
        onClick={() =>
          onChange({
            ...value,
            columns: [
              ...value.columns,
              {
                id: uid("col"),
                span: 6,
                blocks: [createBlock("richText")],
              },
            ],
          })
        }
      >
        + Colonne
      </button>
    </div>
  );
}

function blockHint(b: SiteBlock): string {
  const p = b.props as Record<string, unknown>;
  if (typeof p.title === "string") return p.title;
  if (typeof p.quote === "string") return p.quote.slice(0, 40);
  return b.label ?? "";
}

function NestedBlockFields({
  block,
  onChange,
}: {
  block: SiteBlock;
  onChange: (b: SiteBlock) => void;
}) {
  const props = block.props as Record<string, unknown>;
  const keys = Object.keys(props).filter(
    (k) => typeof props[k] === "string" || typeof props[k] === "number",
  );
  if (keys.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 border-t border-ink-50 pt-2">
      {keys.slice(0, 4).map((k) => (
        <label key={k} className={LABEL}>
          {k}
          <input
            className={FIELD}
            value={String(props[k] ?? "")}
            onChange={(e) =>
              onChange({
                ...block,
                props: {
                  ...props,
                  [k]:
                    typeof props[k] === "number"
                      ? Number(e.target.value) || 0
                      : e.target.value,
                },
              } as SiteBlock)
            }
          />
        </label>
      ))}
    </div>
  );
}
