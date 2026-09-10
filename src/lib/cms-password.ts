export const CMS_SESSION_COOKIE = "cms_editor_session";

/** Hash léger (dev) — fallback mot de passe local uniquement. */
export function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (h * 31 + password.charCodeAt(i)) | 0;
  }
  return `cms_${Math.abs(h).toString(16)}`;
}
