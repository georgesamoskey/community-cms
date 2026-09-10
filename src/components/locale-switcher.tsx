"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

/** Bascule ?lang= pour le chrome i18n. */
export function LocaleSwitcher({
  locales,
  defaultLocale,
  onHome,
}: {
  locales: string[];
  defaultLocale: string;
  onHome?: boolean;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const current = search.get("lang") || defaultLocale;

  const links = useMemo(() => {
    return locales.map((loc) => {
      const params = new URLSearchParams(search.toString());
      if (loc === defaultLocale) params.delete("lang");
      else params.set("lang", loc);
      const q = params.toString();
      return { loc, href: q ? `${pathname}?${q}` : pathname };
    });
  }, [locales, defaultLocale, pathname, search]);

  if (locales.length < 2) return null;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-semibold ${
        onHome ? "text-white/80" : "text-ink-700/70"
      }`}
    >
      {links.map(({ loc, href }) => (
        <Link
          key={loc}
          href={href}
          className={`rounded px-1.5 py-0.5 uppercase ${
            loc === current
              ? onHome
                ? "bg-white/20 text-white"
                : "bg-lagoon-50 text-lagoon-800"
              : "hover:underline"
          }`}
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
