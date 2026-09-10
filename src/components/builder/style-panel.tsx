"use client";

import type { BlockStyle } from "@/builder/block-style";
import { DEFAULT_BLOCK_STYLE } from "@/builder/block-style";

const FIELD =
  "mt-1 w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-ink-700/70";

const PRESETS: { name: string; style: BlockStyle }[] = [
  { name: "Défaut", style: { ...DEFAULT_BLOCK_STYLE } },
  {
    name: "Accent sombre",
    style: {
      paddingY: "lg",
      paddingX: "md",
      background: "#0f2e28",
      textColor: "#f4f7f6",
      radius: "none",
    },
  },
  {
    name: "Carte soft",
    style: {
      paddingY: "lg",
      paddingX: "md",
      background: "#e8f5f1",
      radius: "xl",
      shadow: "sm",
    },
  },
  {
    name: "Bandeau soleil",
    style: {
      paddingY: "md",
      background: "#f0c14d",
      textColor: "#122420",
      align: "center",
    },
  },
  {
    name: "Full bleed dark",
    style: {
      paddingY: "xl",
      width: "full",
      background: "linear-gradient(135deg,#0f2e28,#167a66)",
      textColor: "#fff",
      align: "center",
    },
  },
];

export function StylePanel({
  style,
  onChange,
}: {
  style?: BlockStyle;
  onChange: (s: BlockStyle) => void;
}) {
  const s: BlockStyle = { ...DEFAULT_BLOCK_STYLE, ...style };

  function set<K extends keyof BlockStyle>(key: K, value: BlockStyle[K]) {
    onChange({ ...s, [key]: value });
  }

  return (
    <div className="space-y-3 border-t border-ink-50 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">
        Style du bloc
      </p>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className="rounded-md border border-ink-100 px-2 py-1 text-[11px] hover:bg-lagoon-50"
            onClick={() => onChange({ ...p.style })}
          >
            {p.name}
          </button>
        ))}
      </div>
      <label className={LABEL}>
        Padding Y
        <select
          className={FIELD}
          value={s.paddingY ?? "md"}
          onChange={(e) => set("paddingY", e.target.value as BlockStyle["paddingY"])}
        >
          {["none", "sm", "md", "lg", "xl"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Largeur
        <select
          className={FIELD}
          value={s.width ?? "default"}
          onChange={(e) => set("width", e.target.value as BlockStyle["width"])}
        >
          {["narrow", "default", "wide", "full"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Alignement
        <select
          className={FIELD}
          value={s.align ?? "left"}
          onChange={(e) => set("align", e.target.value as BlockStyle["align"])}
        >
          {["left", "center", "right"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Fond
        <div className="mt-1 flex gap-2">
          <input
            type="color"
            className="h-10 w-12 rounded border border-ink-100"
            value={
              s.background?.startsWith("#") ? s.background : "#ffffff"
            }
            onChange={(e) => set("background", e.target.value)}
          />
          <input
            className={FIELD}
            placeholder="#hex ou gradient CSS"
            value={s.background ?? ""}
            onChange={(e) => set("background", e.target.value || undefined)}
          />
        </div>
      </label>
      <label className={LABEL}>
        Image de fond (URL)
        <input
          className={FIELD}
          value={s.backgroundImage ?? ""}
          onChange={(e) => set("backgroundImage", e.target.value || undefined)}
        />
      </label>
      <label className={LABEL}>
        Couleur texte
        <div className="mt-1 flex gap-2">
          <input
            type="color"
            className="h-10 w-12 rounded border border-ink-100"
            value={s.textColor?.startsWith("#") ? s.textColor : "#122420"}
            onChange={(e) => set("textColor", e.target.value)}
          />
          <input
            className={FIELD}
            value={s.textColor ?? ""}
            onChange={(e) => set("textColor", e.target.value || undefined)}
          />
        </div>
      </label>
      <label className={LABEL}>
        Overlay image ({Math.round((s.overlay ?? 0) * 100)}%)
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          className="mt-2 w-full"
          value={s.overlay ?? 0}
          onChange={(e) => set("overlay", Number(e.target.value))}
        />
      </label>
      <label className={LABEL}>
        Coins
        <select
          className={FIELD}
          value={s.radius ?? "none"}
          onChange={(e) => set("radius", e.target.value as BlockStyle["radius"])}
        >
          {["none", "md", "xl", "full"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Ombre
        <select
          className={FIELD}
          value={s.shadow ?? "none"}
          onChange={(e) => set("shadow", e.target.value as BlockStyle["shadow"])}
        >
          {["none", "sm", "md", "lg"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Animation
        <select
          className={FIELD}
          value={s.animate ?? "none"}
          onChange={(e) => set("animate", e.target.value as BlockStyle["animate"])}
        >
          {["none", "rise", "fade"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!s.border}
          onChange={(e) => set("border", e.target.checked)}
        />
        Bordure
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!s.hideOnMobile}
          onChange={(e) => set("hideOnMobile", e.target.checked)}
        />
        Masquer mobile
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!s.hideOnDesktop}
          onChange={(e) => set("hideOnDesktop", e.target.checked)}
        />
        Masquer desktop
      </label>
      <label className={LABEL}>
        Classes Tailwind
        <input
          className={FIELD}
          value={s.className ?? ""}
          onChange={(e) => set("className", e.target.value || undefined)}
          placeholder="ex: ring-2 ring-lagoon-500"
        />
      </label>
      <label className={LABEL}>
        CSS custom (avancé)
        <textarea
          className={FIELD}
          rows={3}
          value={s.customCss ?? ""}
          onChange={(e) => set("customCss", e.target.value || undefined)}
          placeholder="padding: 2rem;"
        />
      </label>
    </div>
  );
}
