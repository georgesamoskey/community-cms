import { decode, getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";
import {
  authSessionCookieName,
  authSessionCookieSalt,
  authSessionUsesSecureCookie,
} from "@/lib/auth-session-cookie";
import { CMS_SESSION_COOKIE } from "@/lib/cms-auth";

function clearSessionCookies(res: NextResponse, req: NextRequest) {
  const dedicated = authSessionCookieName();
  for (const { name } of req.cookies.getAll()) {
    if (
      name === dedicated ||
      name.startsWith("authjs.cms-session-token.") ||
      name.startsWith("__Secure-authjs.cms-session-token.") ||
      name === "authjs.session-token" ||
      name.startsWith("authjs.session-token.") ||
      name === "__Secure-authjs.session-token" ||
      name.startsWith("__Secure-authjs.session-token.") ||
      name === CMS_SESSION_COOKIE
    ) {
      res.cookies.set(name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
  }
}

async function readIdTokenHint(req: NextRequest, secret: string) {
  const secureCookie = authSessionUsesSecureCookie();
  const salt = authSessionCookieSalt();
  const cookieName = authSessionCookieName();
  const token = await getToken({ req, secret, secureCookie, cookieName });
  const fromParsed =
    token && typeof (token as { id_token?: string }).id_token === "string"
      ? (token as { id_token: string }).id_token
      : undefined;
  if (fromParsed) return fromParsed;
  const raw = await getToken({
    req,
    secret,
    secureCookie,
    cookieName,
    raw: true,
  });
  if (typeof raw !== "string") return undefined;
  const payload = await decode({ token: raw, secret, salt });
  return typeof payload?.id_token === "string" ? payload.id_token : undefined;
}

/** Déconnexion Keycloak + cookies Auth.js / mot de passe. */
export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const issuer = (process.env.AUTH_KEYCLOAK_ISSUER ?? "").replace(/\/$/, "");
  const appBase =
    (process.env.AUTH_URL ?? req.nextUrl.origin).replace(/\/$/, "") ||
    req.nextUrl.origin;
  const postLogout = `${appBase}/cms-admin`;

  if (!secret || !issuer) {
    const res = NextResponse.redirect(postLogout);
    clearSessionCookies(res, req);
    return res;
  }

  const idToken = await readIdTokenHint(req, secret).catch(() => undefined);
  const kcClientId = process.env.AUTH_KEYCLOAK_ID;
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogout,
  });
  if (kcClientId) params.set("client_id", kcClientId);
  if (idToken) params.set("id_token_hint", idToken);

  const res = NextResponse.redirect(
    `${issuer}/protocol/openid-connect/logout?${params.toString()}`,
  );
  clearSessionCookies(res, req);
  return res;
}
