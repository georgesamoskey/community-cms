"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  COUNTRY_COOKIE,
  COUNTRY_META,
  LOCALE_COOKIE,
  LOCALE_META,
  type CountryCode,
  type Locale,
  normalizeCountry,
  normalizeLocale,
} from "./config";
import { messages, tPath, type MessageTree } from "./messages";

type I18nContextValue = {
  locale: Locale;
  country: CountryCode;
  messages: MessageTree;
  t: (path: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  setCountry: (country: CountryCode) => void;
  availableLocales: readonly Locale[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;samesite=lax`;
}

/** Sync ?lang= → state (suspends) — isolé pour ne pas retirer le Provider. */
function LangFromUrl({
  country,
  onLang,
}: {
  country: CountryCode;
  onLang: (loc: Locale) => void;
}) {
  const search = useSearchParams();
  useEffect(() => {
    const lang = search.get("lang");
    if (lang) onLang(normalizeLocale(lang, country));
  }, [search, country, onLang]);
  return null;
}

export function I18nProvider({
  children,
  initialLocale,
  initialCountry,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialCountry?: CountryCode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [country, setCountryState] = useState<CountryCode>(() =>
    normalizeCountry(initialCountry ?? "BI"),
  );
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale, country),
  );

  const applyLangFromUrl = useCallback(
    (loc: Locale) => {
      setLocaleState(loc);
      writeCookie(LOCALE_COOKIE, loc);
    },
    [],
  );

  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].bcp47;
  }, [locale]);

  const pushLang = useCallback(
    (loc: Locale) => {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      params.set("lang", loc);
      const q = params.toString();
      router.replace(`${pathname}?${q}`, { scroll: false });
    },
    [pathname, router],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      const loc = normalizeLocale(next, country);
      setLocaleState(loc);
      writeCookie(LOCALE_COOKIE, loc);
      pushLang(loc);
    },
    [country, pushLang],
  );

  const setCountry = useCallback(
    (nextRaw: CountryCode) => {
      const next = normalizeCountry(nextRaw);
      setCountryState(next);
      writeCookie(COUNTRY_COOKIE, next);
      const loc = normalizeLocale(locale, next);
      setLocaleState(loc);
      writeCookie(LOCALE_COOKIE, loc);
      pushLang(loc);
    },
    [locale, pushLang],
  );

  const tree = messages[locale] ?? messages.fr;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      country,
      messages: tree as MessageTree,
      t: (path, params) => tPath(tree as MessageTree, path, params),
      setLocale,
      setCountry,
      availableLocales: COUNTRY_META[country].languages,
    }),
    [locale, country, tree, setLocale, setCountry],
  );

  return (
    <I18nContext.Provider value={value}>
      <Suspense fallback={null}>
        <LangFromUrl country={country} onLang={applyLangFromUrl} />
      </Suspense>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
