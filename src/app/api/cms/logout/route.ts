import { NextResponse } from "next/server";
import { CMS_SESSION_COOKIE } from "@/lib/cms-auth";

/** Clear cookie mot de passe local (Keycloak : utiliser /api/keycloak/logout). */
export async function POST() {
  const res = NextResponse.json({
    ok: true,
    keycloakLogout: "/api/keycloak/logout",
  });
  res.cookies.set(CMS_SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
