import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { authSessionCookieName, authSessionUsesSecureCookie } from "@/lib/auth-session-cookie";
import { CMS_SESSION_COOKIE, hashPassword } from "@/lib/cms-password";
import { canAccessCmsStudio } from "@/lib/cms-rbac";

function keycloakConfigured(): boolean {
  return Boolean(
    process.env.AUTH_KEYCLOAK_ISSUER &&
      process.env.AUTH_KEYCLOAK_ID &&
      process.env.AUTH_KEYCLOAK_SECRET,
  );
}

/**
 * Protège les API CMS (hors chrome public + auth session).
 * La page /cms-admin reste accessible pour le login Keycloak.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/cms/public-chrome")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api/cms/")) {
    return NextResponse.next();
  }

  if (
    pathname === "/api/cms/login" ||
    pathname === "/api/cms/logout" ||
    pathname === "/api/cms/session"
  ) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  let hasAccess = false;

  if (secret && keycloakConfigured()) {
    try {
      const token = await getToken({
        req,
        secret,
        secureCookie: authSessionUsesSecureCookie(),
        cookieName: authSessionCookieName(),
      });
      const roles = Array.isArray((token as { roles?: string[] } | null)?.roles)
        ? (token as { roles: string[] }).roles
        : [];
      if (token && canAccessCmsStudio(roles)) hasAccess = true;
    } catch {
      /* ignore */
    }
  }

  if (!hasAccess) {
    const expected = process.env.CMS_EDITOR_PASSWORD;
    const cookie = req.cookies.get(CMS_SESSION_COOKIE)?.value;
    const allowPassword =
      !!expected &&
      (!keycloakConfigured() || process.env.CMS_ALLOW_PASSWORD_AUTH === "true");
    if (allowPassword && cookie && cookie === hashPassword(expected)) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/cms/:path*"],
};
