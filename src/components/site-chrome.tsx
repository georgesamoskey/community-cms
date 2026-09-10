"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { NavItem, SiteDocument } from "@/builder/types";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { backofficeUrl, cx, portalUrl } from "@/lib/site";
import { isExternalHref, resolveHref } from "@/lib/resolve-href";
import { useI18n } from "@/lib/i18n/context";

function NavLink({
  item,
  onHome,
  pathname,
}: {
  item: NavItem;
  onHome: boolean;
  pathname: string;
}) {
  const href = resolveHref(item.href);
  const active =
    !item.external &&
    !isExternalHref(item.href) &&
    (pathname === item.href || pathname.startsWith(`${item.href}/`));
  const className = cx(
    "text-sm font-medium transition",
    onHome
      ? "text-white/80 hover:text-white"
      : active
        ? "text-lagoon-700"
        : "text-ink-700/80 hover:text-lagoon-700",
  );
  if (item.external || isExternalHref(item.href)) {
    return (
      <a href={href} className={className}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {item.label}
    </Link>
  );
}

function useChromeQuery() {
  const search = useSearchParams();
  const preview = search.get("preview") === "1";
  const lang = search.get("lang");
  const qs = new URLSearchParams();
  if (preview) qs.set("preview", "1");
  if (lang) qs.set("lang", lang);
  const q = qs.toString();
  return q ? `?${q}` : "";
}

function SiteHeaderInner() {
  const pathname = usePathname();
  const chromeQs = useChromeQuery();
  const { t, messages } = useI18n();
  const [chrome, setChrome] = useState<{
    brand: string;
    nav: NavItem[];
    cta: { label: string; href: string };
    locales: string[];
    defaultLocale: string;
  } | null>(null);

  useEffect(() => {
    void fetch(`/api/cms/public-chrome${chromeQs}`)
      .then((r) => r.json())
      .then(
        (j: {
          settings?: SiteDocument["settings"];
          nav?: NavItem[];
          locales?: string[];
          defaultLocale?: string;
        }) => {
          if (j.settings && j.nav) {
            setChrome({
              brand: j.settings.brand,
              nav: j.nav,
              cta: j.settings.primaryCta,
              locales: j.locales ?? j.settings.i18n?.locales ?? ["fr"],
              defaultLocale:
                j.defaultLocale ?? j.settings.i18n?.defaultLocale ?? "fr",
            });
          }
        },
      )
      .catch(() => undefined);
  }, [pathname, chromeQs]);

  if (pathname.startsWith("/cms-admin")) return null;

  const onHome = pathname === "/";
  const brand = chrome?.brand ?? messages.brand;
  const nav = chrome?.nav ?? [
    { id: "1", label: t("site.features"), href: "/features" },
    { id: "2", label: t("site.pricing"), href: "/pricing" },
    { id: "3", label: t("site.about"), href: "/about" },
    { id: "4", label: t("site.blog"), href: "/blog" },
    { id: "5", label: t("site.contact"), href: "/contact" },
    { id: "6", label: t("site.status"), href: "/status" },
  ];
  const cta = chrome?.cta ?? {
    label: t("auth.signIn"),
    href: `${portalUrl()}/login`,
  };

  return (
    <header
      className={cx(
        "z-20 w-full",
        onHome
          ? "absolute inset-x-0 top-0 bg-transparent"
          : "relative border-b border-ink-100 bg-white/90 backdrop-blur",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          href="/"
          className={cx(
            "font-display text-2xl font-semibold tracking-tight",
            onHome ? "text-white" : "text-ink-900",
          )}
        >
          {brand}
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <NavLink key={n.id} item={n} onHome={onHome} pathname={pathname} />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {chrome && (
            <LocaleSwitcher
              locales={chrome.locales}
              defaultLocale={chrome.defaultLocale}
              onHome={onHome}
            />
          )}
          <Link
            href="/register"
            className={cx(
              "rounded-full px-3 py-2 text-sm font-semibold transition sm:px-4",
              onHome
                ? "border border-white/30 text-white hover:bg-white/10"
                : "border border-ink-200 text-ink-800 hover:border-lagoon-400 hover:text-lagoon-700",
            )}
          >
            <span className="sm:hidden">{t("site.registerShort")}</span>
            <span className="hidden sm:inline">{t("site.register")}</span>
          </Link>
          <a
            href={resolveHref(cta.href)}
            className={cx(
              "rounded-full px-4 py-2 text-sm font-semibold shadow-md transition",
              onHome
                ? "bg-sun-400 text-ink-900 hover:bg-sun-500"
                : "bg-lagoon-600 text-white shadow-lagoon-700/20 hover:bg-lagoon-700",
            )}
          >
            {cta.label}
          </a>
        </div>
      </div>
      <nav
        className={cx(
          "flex gap-4 overflow-x-auto px-4 pb-3 md:hidden",
          onHome ? "text-white/80" : "text-ink-700/80",
        )}
      >
        {nav.map((n) => (
          <NavLink key={n.id} item={n} onHome={onHome} pathname={pathname} />
        ))}
      </nav>
    </header>
  );
}

export function SiteHeader() {
  return (
    <Suspense fallback={null}>
      <SiteHeaderInner />
    </Suspense>
  );
}

function SiteFooterInner() {
  const pathname = usePathname();
  const chromeQs = useChromeQuery();
  const [footer, setFooter] = useState<{
    brand: string;
    blurb: string;
    links: NavItem[];
    showStudioLink: boolean;
  } | null>(null);

  useEffect(() => {
    void fetch(`/api/cms/public-chrome${chromeQs}`)
      .then((r) => r.json())
      .then(
        (j: {
          settings?: SiteDocument["settings"];
          footer?: SiteDocument["footer"];
        }) => {
          if (j.settings && j.footer) {
            setFooter({
              brand: j.settings.brand,
              blurb: j.footer.blurb,
              links: j.footer.links,
              showStudioLink: j.footer.showStudioLink,
            });
          }
        },
      )
      .catch(() => undefined);
  }, [pathname, chromeQs]);

  if (pathname.startsWith("/cms-admin")) return null;

  const portal = portalUrl();
  const bo = backofficeUrl();
  const brand = footer?.brand ?? "Community";
  const blurb = footer?.blurb ?? "Épargne collective et tontines, en clair.";
  const links = footer?.links ?? [];
  const showStudio = footer?.showStudioLink ?? true;

  return (
    <footer className="mt-auto border-t border-ink-100 bg-ink-900 text-ink-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-xl font-semibold">{brand}</p>
          <p className="mt-2 text-sm text-ink-200/80">{blurb}</p>
        </div>
        <div className="text-sm">
          <p className="font-medium text-white">Liens</p>
          <ul className="mt-3 space-y-2 text-ink-200/80">
            {links.map((l) => (
              <li key={l.id}>
                {l.external || isExternalHref(l.href) ? (
                  <a href={resolveHref(l.href)} className="hover:text-white">
                    {l.label}
                  </a>
                ) : (
                  <Link href={resolveHref(l.href)} className="hover:text-white">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
            {bo && (
              <li>
                <a href={bo} className="hover:text-white">
                  Backoffice (ops)
                </a>
              </li>
            )}
            {showStudio && (
              <li>
                <Link href="/cms-admin" className="hover:text-white">
                  Studio site builder
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className="text-sm text-ink-200/70">
          <p>Construisez pages, menus et contenus depuis le studio.</p>
          <p className="mt-2">
            <Link href="/cms-admin" className="underline hover:text-white">
              Ouvrir le builder →
            </Link>
          </p>
          <p className="mt-4 text-xs opacity-60">
            Portail : {portal.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SiteFooter() {
  return (
    <Suspense fallback={null}>
      <SiteFooterInner />
    </Suspense>
  );
}
