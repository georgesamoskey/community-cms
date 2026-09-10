export function portalUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PORTAL_URL?.replace(/\/$/, "") ||
    "http://localhost:3003"
  );
}

export function backofficeUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_BACKOFFICE_URL?.replace(/\/$/, "");
  return u || null;
}

export function apiOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_EAGASEKE_ORIGIN?.replace(/\/$/, "") ||
    "http://localhost:30009"
  );
}

export function cx(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(" ");
}
