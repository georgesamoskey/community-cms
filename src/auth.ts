import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import {
  claimsFromIdToken,
  rolesFromAccessToken,
} from "@/lib/keycloak-id-token";
import {
  authSessionCookieName,
  authSessionUsesSecureCookie,
} from "@/lib/auth-session-cookie";

const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
const clientId = process.env.AUTH_KEYCLOAK_ID;
const clientSecret = process.env.AUTH_KEYCLOAK_SECRET;
const oidcScope = process.env.AUTH_KEYCLOAK_SCOPE?.trim() || "openid";
const oidcPromptLogin = process.env.AUTH_KEYCLOAK_PROMPT_LOGIN === "true";

const keycloakConfigured = Boolean(issuer && clientId && clientSecret);

async function refreshKeycloakAccessToken(token: JWT): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  idToken?: string;
}> {
  const iss = (issuer ?? "").replace(/\/$/, "");
  const res = await fetch(`${iss}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: String(token.refreshToken ?? ""),
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      String(json.error_description ?? json.error ?? "refresh_token_failed"),
    );
  }
  const access = json.access_token as string;
  const refresh = (json.refresh_token as string | undefined) ?? undefined;
  const idTok =
    typeof json.id_token === "string" ? (json.id_token as string) : undefined;
  const expIn = typeof json.expires_in === "number" ? json.expires_in : 300;
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresAt: Date.now() + expIn * 1000,
    idToken: idTok,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name: authSessionCookieName(),
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: authSessionUsesSecureCookie(),
      },
    },
  },
  pages: {
    error: "/cms-admin",
    signIn: "/cms-admin",
  },
  debug: process.env.AUTH_DEBUG === "true",
  providers: [
    {
      id: "keycloak",
      name: "Keycloak",
      type: "oidc",
      style: { brandColor: "#167a66" },
      issuer:
        issuer ??
        "http://127.0.0.1:65535/realms/__configure_auth_keycloak_issuer__",
      clientId: clientId ?? "cms-build-placeholder",
      clientSecret: clientSecret ?? "cms-build-placeholder",
      checks: ["pkce", "state"],
      authorization: {
        params: {
          scope: oidcScope,
          ...(oidcPromptLogin ? { prompt: "login" as const } : {}),
        },
      },
    },
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const issuerBase = (issuer ?? "").replace(/\/$/, "");
        if (issuerBase && url.startsWith(`${issuerBase}/`)) return url;
        const u = new URL(url);
        if (u.origin === new URL(baseUrl).origin) return url;
      } catch {
        /* ignore */
      }
      return baseUrl;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        if (typeof account.id_token === "string") {
          token.id_token = account.id_token;
          const c = claimsFromIdToken(account.id_token);
          if (c.sub) token.sub = c.sub;
          if (c.email) token.email = c.email;
          if (c.preferred_username) token.preferred_username = c.preferred_username;
          token.name = c.name ?? c.preferred_username;
          if (c.roles?.length) token.roles = c.roles;
        }
        const accessRoles = rolesFromAccessToken(
          typeof account.access_token === "string"
            ? account.access_token
            : undefined,
        );
        if (accessRoles.length) token.roles = accessRoles;
        if (typeof account.expires_at === "number") {
          token.expiresAt = account.expires_at * 1000;
        } else if (typeof account.expires_in === "number") {
          token.expiresAt = Date.now() + account.expires_in * 1000;
        } else {
          token.expiresAt = Date.now() + 300 * 1000;
        }
        return token;
      }

      const exp = token.expiresAt as number | undefined;
      if (exp && Date.now() < exp - 30_000) return token;
      if (!token.refreshToken) return token;
      try {
        const r = await refreshKeycloakAccessToken(token);
        token.accessToken = r.accessToken;
        if (r.refreshToken) token.refreshToken = r.refreshToken;
        if (r.idToken) token.id_token = r.idToken;
        token.expiresAt = r.expiresAt;
        const accessRoles = rolesFromAccessToken(r.accessToken);
        if (accessRoles.length) token.roles = accessRoles;
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.error === "string") session.error = token.error;
      else delete session.error;
      if (session.user) {
        if (typeof token.sub === "string") session.user.id = token.sub;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        else if (typeof token.preferred_username === "string") {
          session.user.name = token.preferred_username;
        }
        session.user.roles = Array.isArray(token.roles)
          ? (token.roles as string[])
          : [];
      }
      return session;
    },
  },
});

export function isKeycloakConfigured(): boolean {
  return keycloakConfigured;
}
