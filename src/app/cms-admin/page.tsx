"use client";

import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { BuilderStudio } from "@/components/builder/builder-studio";
import type { CmsCapabilities } from "@/lib/cms-rbac";

type Identity = {
  mode: "keycloak" | "password" | null;
  name?: string;
  email?: string;
  roles?: string[];
  capabilities?: CmsCapabilities;
  error?: string;
};

export default function CmsAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [keycloakOn, setKeycloakOn] = useState(true);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [denyHint, setDenyHint] = useState<string | null>(null);

  const probe = useCallback(async () => {
    const res = await fetch("/api/cms/session");
    const j = (await res.json()) as {
      authenticated?: boolean;
      keycloak?: boolean;
      identity?: Identity;
      error?: string;
      hint?: string;
    };
    setKeycloakOn(j.keycloak !== false);
    if (res.ok && j.authenticated && j.identity?.capabilities) {
      setAuthed(true);
      setIdentity(j.identity);
      setDenyHint(null);
      return;
    }
    setAuthed(false);
    setIdentity(j.identity ?? null);
    setDenyHint(
      j.error === "missing_cms_role" || j.identity?.error === "missing_cms_role"
        ? j.hint ??
            "Votre compte Keycloak n’a pas de rôle CMS. Demandez cms_editor ou cms_publisher."
        : null,
    );
  }, []);

  useEffect(() => {
    (async () => {
      await probe();
      setChecking(false);
    })();
  }, [probe]);

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/cms/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "Échec");
        return;
      }
      await probe();
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (identity?.mode === "keycloak" || keycloakOn) {
      window.location.href = "/api/keycloak/logout";
      return;
    }
    void fetch("/api/cms/logout", { method: "POST" }).then(() => {
      setAuthed(false);
      setIdentity(null);
    });
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-700/70">
        Vérification session…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f1] px-4">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Site builder
          </h1>
          <p className="mt-2 text-sm text-ink-700/70">
            Rôles Keycloak :{" "}
            <code className="text-xs">cms_viewer</code> (lecture),{" "}
            <code className="text-xs">cms_editor</code> (brouillon),{" "}
            <code className="text-xs">cms_publisher</code> (publier), ou{" "}
            <code className="text-xs">admin</code> /{" "}
            <code className="text-xs">super_admin</code>.
          </p>

          {denyHint && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {denyHint}
            </p>
          )}

          {keycloakOn ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void signIn("keycloak", { callbackUrl: "/cms-admin" });
              }}
              className="mt-6 w-full rounded-xl bg-lagoon-600 py-3 text-sm font-semibold text-white hover:bg-lagoon-700 disabled:opacity-60"
            >
              Connexion avec Keycloak
            </button>
          ) : (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Keycloak non configuré — renseignez{" "}
              <code className="text-xs">AUTH_KEYCLOAK_*</code>.
            </p>
          )}

          <button
            type="button"
            className="mt-4 text-xs font-medium text-ink-700/50 underline"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword
              ? "Masquer le fallback mot de passe"
              : "Fallback mot de passe (dev)"}
          </button>

          {showPassword && (
            <form onSubmit={loginPassword} className="mt-4 border-t border-ink-50 pt-4">
              <p className="text-xs text-ink-700/60">
                Nécessite <code>CMS_ALLOW_PASSWORD_AUTH=true</code> si Keycloak
                est actif.
              </p>
              <input
                type="password"
                className="mt-3 w-full rounded-xl border border-ink-100 px-3 py-2 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="CMS_EDITOR_PASSWORD"
              />
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                Entrer (mot de passe)
              </button>
            </form>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  const caps = identity?.capabilities;
  if (!caps) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-700">
        Capacités CMS manquantes — reconnectez-vous.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-40 flex max-w-sm flex-col items-end gap-2">
        <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-[11px] text-ink-700/70 shadow-md">
          <p className="font-semibold text-ink-900">
            {identity?.name ?? "Éditeur"}
            {identity?.mode === "keycloak" ? " · Keycloak" : " · local"}
          </p>
          <p className="mt-0.5 truncate">
            {(identity?.roles ?? []).filter((r) => !r.startsWith("default-")).join(", ") ||
              "—"}
          </p>
          <p className="mt-1 text-[10px] text-ink-700/50">
            {[
              caps.canEdit && "edit",
              caps.canPublish && "publish",
              caps.canManageMedia && "media",
              caps.canManageTheme && "theme",
              !caps.canEdit && "read-only",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-semibold shadow-md"
        >
          Déconnexion
        </button>
      </div>
      <BuilderStudio capabilities={caps} />
    </div>
  );
}
