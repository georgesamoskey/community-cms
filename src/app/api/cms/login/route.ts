import { NextResponse } from "next/server";
import { isKeycloakConfigured } from "@/auth";
import {
  CMS_SESSION_COOKIE,
  hashPassword,
} from "@/lib/cms-auth";

export async function POST(req: Request) {
  if (isKeycloakConfigured() && process.env.CMS_ALLOW_PASSWORD_AUTH !== "true") {
    return NextResponse.json(
      {
        error:
          "Utilisez la connexion Keycloak. (CMS_ALLOW_PASSWORD_AUTH=true pour le fallback.)",
      },
      { status: 403 },
    );
  }
  const expected = process.env.CMS_EDITOR_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "CMS_EDITOR_PASSWORD non configuré" },
      { status: 503 },
    );
  }
  const body = (await req.json()) as { password?: string };
  if (!body.password || body.password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, mode: "password" });
  res.cookies.set(CMS_SESSION_COOKIE, hashPassword(expected), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
