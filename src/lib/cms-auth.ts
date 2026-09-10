import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth, isKeycloakConfigured } from "@/auth";
import {
  type CmsCapabilities,
  type CmsPermissionId,
  FULL_CMS_CAPABILITIES,
  canAccessCmsStudio,
  capabilitiesFromRoles,
  hasCmsPermission,
} from "@/lib/cms-rbac";
import { CMS_SESSION_COOKIE, hashPassword } from "@/lib/cms-password";

export { CMS_SESSION_COOKIE, hashPassword } from "@/lib/cms-password";

/** @deprecated préférer canAccessCmsStudio / hasCmsPermission */
export function cmsAllowedRoles(): string[] {
  const raw = process.env.CMS_ALLOWED_ROLES?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return [
    "cms_viewer",
    "cms_editor",
    "cms_publisher",
    "admin",
    "super_admin",
    "moderator",
    "support",
  ];
}

/** @deprecated */
export function rolesAllowCms(roles: string[] | undefined): boolean {
  if (process.env.CMS_ALLOWED_ROLES?.trim()) {
    const allowed = new Set(cmsAllowedRoles());
    return (roles ?? []).some((r) => allowed.has(r));
  }
  return canAccessCmsStudio(roles);
}

function passwordAuthEnabled(): boolean {
  if (!process.env.CMS_EDITOR_PASSWORD) return false;
  if (isKeycloakConfigured()) {
    return process.env.CMS_ALLOW_PASSWORD_AUTH === "true";
  }
  return true;
}

async function passwordSessionOk(): Promise<boolean> {
  if (!passwordAuthEnabled()) return false;
  const jar = await cookies();
  const v = jar.get(CMS_SESSION_COOKIE)?.value;
  const expected = process.env.CMS_EDITOR_PASSWORD;
  if (!expected || !v) return false;
  return v === hashPassword(expected);
}

export async function getCmsSessionRoles(): Promise<{
  mode: "keycloak" | "password" | null;
  roles: string[];
  name?: string;
  email?: string;
  error?: string;
}> {
  if (isKeycloakConfigured()) {
    try {
      const session = await auth();
      if (session?.error === "RefreshAccessTokenError") {
        return { mode: null, roles: [], error: session.error };
      }
      const roles = session?.user?.roles ?? [];
      if (session?.user && canAccessCmsStudio(roles)) {
        return {
          mode: "keycloak",
          roles,
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined,
        };
      }
      // Keycloak connecté mais sans rôle CMS → ne pas tomber sur le mot de passe
      if (session?.user) {
        return {
          mode: null,
          roles,
          name: session.user.name ?? undefined,
          email: session.user.email ?? undefined,
          error: "missing_cms_role",
        };
      }
    } catch {
      /* Cookie session illisible (ex. ancien AUTH_SECRET / autre app localhost) */
    }
  }

  if (await passwordSessionOk()) {
    return { mode: "password", roles: ["password"] };
  }
  return { mode: null, roles: [] };
}

export async function getCmsCapabilities(): Promise<CmsCapabilities | null> {
  const s = await getCmsSessionRoles();
  if (s.mode === "password") return FULL_CMS_CAPABILITIES;
  if (s.mode === "keycloak") return capabilitiesFromRoles(s.roles);
  return null;
}

export async function isCmsEditorAuthenticated(): Promise<boolean> {
  return (await getCmsCapabilities()) != null;
}

export async function getCmsEditorIdentity(): Promise<{
  mode: "keycloak" | "password" | null;
  name?: string;
  email?: string;
  roles?: string[];
  capabilities?: CmsCapabilities;
  error?: string;
}> {
  const s = await getCmsSessionRoles();
  if (!s.mode) {
    return {
      mode: null,
      name: s.name,
      email: s.email,
      roles: s.roles,
      error: s.error,
    };
  }
  const capabilities =
    s.mode === "password"
      ? FULL_CMS_CAPABILITIES
      : capabilitiesFromRoles(s.roles);
  return {
    mode: s.mode,
    name: s.name,
    email: s.email,
    roles: s.roles,
    capabilities,
  };
}

/** Guard API : 401 si anonyme, 403 si rôle insuffisant. */
export async function requireCmsPermission(
  required: CmsPermissionId,
): Promise<NextResponse | null> {
  const s = await getCmsSessionRoles();
  if (!s.mode) {
    return NextResponse.json(
      {
        error:
          s.error === "missing_cms_role"
            ? "Compte Keycloak sans rôle CMS (cms_viewer / cms_editor / cms_publisher / admin)."
            : "Non autorisé",
        code: s.error ?? "unauthorized",
      },
      { status: 401 },
    );
  }
  if (s.mode === "password") return null;
  if (!hasCmsPermission(s.roles, required)) {
    return NextResponse.json(
      {
        error: `Permission requise : ${required}`,
        code: "forbidden",
        required,
        roles: s.roles,
      },
      { status: 403 },
    );
  }
  return null;
}
