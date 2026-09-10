/** Aligné sur Auth.js : cookie __Secure-* si prod ou si AUTH_URL est en https. */
export function authSessionUsesSecureCookie(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const u = process.env.AUTH_URL ?? "";
  return u.startsWith("https://");
}

/**
 * Nom unique par app — évite que portal / backoffice / cms
 * (ports localhost distincts mais cookie `authjs.session-token` partagé)
 * se marchent dessus avec des AUTH_SECRET différents.
 */
export function authSessionCookieName(): string {
  const base = "authjs.cms-session-token";
  return authSessionUsesSecureCookie() ? `__Secure-${base}` : base;
}

/** @deprecated alias — préférer authSessionCookieName */
export function authSessionCookieSalt(): string {
  return authSessionCookieName();
}
