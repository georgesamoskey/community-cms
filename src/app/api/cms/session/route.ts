import { NextResponse } from "next/server";
import { isKeycloakConfigured } from "@/auth";
import { getCmsEditorIdentity } from "@/lib/cms-auth";
import {
  CMS_PERMISSION_META,
  CMS_ROLE_META,
  CMS_ROLE_PERMISSIONS,
} from "@/lib/cms-rbac";

export async function GET() {
  const identity = await getCmsEditorIdentity();
  if (!identity.mode) {
    return NextResponse.json(
      {
        authenticated: false,
        keycloak: isKeycloakConfigured(),
        error: identity.error,
        hint:
          identity.error === "missing_cms_role"
            ? "Demandez cms_editor / cms_publisher / admin à un super_admin."
            : undefined,
        catalog: {
          roles: CMS_ROLE_META,
          permissions: CMS_PERMISSION_META,
        },
      },
      { status: 401 },
    );
  }
  return NextResponse.json({
    authenticated: true,
    keycloak: isKeycloakConfigured(),
    identity,
    catalog: {
      roles: Object.fromEntries(
        Object.entries(CMS_ROLE_META).map(([id, meta]) => [
          id,
          { ...meta, permissions: CMS_ROLE_PERMISSIONS[id] ?? [] },
        ]),
      ),
      permissions: CMS_PERMISSION_META,
    },
  });
}
