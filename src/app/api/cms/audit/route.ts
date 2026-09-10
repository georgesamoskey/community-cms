import { NextResponse } from "next/server";
import { getCmsEditorIdentity, requireCmsPermission } from "@/lib/cms-auth";
import { readCmsAudit } from "@/lib/cms-audit";
import { CmsPermission } from "@/lib/cms-rbac";

/** Journal d’audit CMS (publish / save / discard / media). */
export async function GET(req: Request) {
  const denied = await requireCmsPermission(CmsPermission.SITE_READ);
  if (denied) return denied;

  const url = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 40) || 40),
  );
  const entries = await readCmsAudit(limit);
  const identity = await getCmsEditorIdentity();
  return NextResponse.json({
    entries,
    identity: { mode: identity.mode, roles: identity.roles },
  });
}
