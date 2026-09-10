"use client";

import { COUNTRY_META, LOCALE_META, type CountryCode, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";
import { cx } from "@/lib/site";

/** Sélecteur pays + langue (compte / auth) — aligné portail. */
export function AuthLocaleSwitcher({
  className,
  light,
}: {
  className?: string;
  light?: boolean;
}) {
  const { locale, country, setLocale, setCountry, availableLocales, t } =
    useI18n();

  const selectClass = cx(
    "rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none",
    light
      ? "border-white/25 bg-white/10 text-white"
      : "border-ink-200 bg-white text-ink-800",
  );

  return (
    <div className={cx("flex flex-wrap items-center gap-1.5", className)}>
      <label className="sr-only" htmlFor="cms-i18n-country">
        {t("common.country")}
      </label>
      <select
        id="cms-i18n-country"
        value={country}
        onChange={(e) => setCountry(e.target.value as CountryCode)}
        className={selectClass}
      >
        {(Object.keys(COUNTRY_META) as CountryCode[]).map((c) => (
          <option key={c} value={c}>
            {c} · {COUNTRY_META[c].name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="cms-i18n-locale">
        {t("common.language")}
      </label>
      <select
        id="cms-i18n-locale"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={selectClass}
      >
        {availableLocales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_META[l].nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
