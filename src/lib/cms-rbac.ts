/**
 * RBAC CMS (site builder) — aligné Keycloak realm + catalogue eagaseke/BO.
 *
 * Rôles Keycloak dédiés : cms_viewer, cms_editor, cms_publisher
 * Staff HQ (admin, super_admin, …) héritent via ROLE_PERMISSIONS.
 */

export const CmsPermission = {
  SITE_READ: "cms.site.read",
  SITE_EDIT: "cms.site.edit",
  SITE_PUBLISH: "cms.site.publish",
  MEDIA_MANAGE: "cms.media.manage",
  THEME_MANAGE: "cms.theme.manage",
} as const;

export type CmsPermissionId =
  (typeof CmsPermission)[keyof typeof CmsPermission];

export const CMS_PERMISSION_META: Record<
  CmsPermissionId,
  { label: string; description: string }
> = {
  [CmsPermission.SITE_READ]: {
    label: "CMS — lecture",
    description: "Voir le studio et prévisualiser les brouillons",
  },
  [CmsPermission.SITE_EDIT]: {
    label: "CMS — édition",
    description: "Modifier pages, blocs, menus, blog (brouillon)",
  },
  [CmsPermission.SITE_PUBLISH]: {
    label: "CMS — publication",
    description: "Publier / annuler brouillon vers le site live",
  },
  [CmsPermission.MEDIA_MANAGE]: {
    label: "CMS — médias",
    description: "Uploader et gérer la médiathèque",
  },
  [CmsPermission.THEME_MANAGE]: {
    label: "CMS — marque / thème",
    description: "Couleurs, CSS global, CTA marque",
  },
};

const CMS_ALL: CmsPermissionId[] = [
  CmsPermission.SITE_READ,
  CmsPermission.SITE_EDIT,
  CmsPermission.SITE_PUBLISH,
  CmsPermission.MEDIA_MANAGE,
  CmsPermission.THEME_MANAGE,
];

/** Mapping rôles Keycloak → permissions CMS. */
export const CMS_ROLE_PERMISSIONS: Record<string, CmsPermissionId[]> = {
  cms_viewer: [CmsPermission.SITE_READ],
  cms_editor: [
    CmsPermission.SITE_READ,
    CmsPermission.SITE_EDIT,
    CmsPermission.MEDIA_MANAGE,
  ],
  cms_publisher: [
    CmsPermission.SITE_READ,
    CmsPermission.SITE_EDIT,
    CmsPermission.SITE_PUBLISH,
    CmsPermission.MEDIA_MANAGE,
    CmsPermission.THEME_MANAGE,
  ],
  /** Staff HQ */
  admin: CMS_ALL,
  super_admin: CMS_ALL,
  moderator: [CmsPermission.SITE_READ],
  support: [CmsPermission.SITE_READ],
  /** Pas d’accès CMS par défaut */
  finance: [],
  compliance_officer: [],
  customer: [],
  customer_premium: [],
  org_owner: [],
  user: [],
};

export const CMS_ROLE_META: Record<
  string,
  { label: string; description: string }
> = {
  cms_viewer: {
    label: "CMS — Lecteur",
    description: "Prévisualisation uniquement",
  },
  cms_editor: {
    label: "CMS — Éditeur",
    description: "Édite le brouillon + médias (sans publier)",
  },
  cms_publisher: {
    label: "CMS — Publieur",
    description: "Édite, thème, médias et publication live",
  },
};

export type CmsCapabilities = {
  canRead: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canManageMedia: boolean;
  canManageTheme: boolean;
  permissions: CmsPermissionId[];
  roles: string[];
};

export function cmsPermissionsForRoles(
  roles: string[] | undefined | null,
): Set<CmsPermissionId> {
  const out = new Set<CmsPermissionId>();
  if (!roles?.length) return out;
  for (const r of roles) {
    const list = CMS_ROLE_PERMISSIONS[r];
    if (list) for (const p of list) out.add(p);
  }
  return out;
}

export function hasCmsPermission(
  roles: string[] | undefined | null,
  required: CmsPermissionId,
): boolean {
  return cmsPermissionsForRoles(roles).has(required);
}

export function capabilitiesFromRoles(
  roles: string[] | undefined | null,
): CmsCapabilities {
  const perms = cmsPermissionsForRoles(roles);
  return {
    canRead: perms.has(CmsPermission.SITE_READ),
    canEdit: perms.has(CmsPermission.SITE_EDIT),
    canPublish: perms.has(CmsPermission.SITE_PUBLISH),
    canManageMedia: perms.has(CmsPermission.MEDIA_MANAGE),
    canManageTheme: perms.has(CmsPermission.THEME_MANAGE),
    permissions: [...perms],
    roles: roles ?? [],
  };
}

/** Accès studio = au moins lecture CMS. */
export function canAccessCmsStudio(roles: string[] | undefined | null): boolean {
  return hasCmsPermission(roles, CmsPermission.SITE_READ);
}

export const FULL_CMS_CAPABILITIES: CmsCapabilities = {
  canRead: true,
  canEdit: true,
  canPublish: true,
  canManageMedia: true,
  canManageTheme: true,
  permissions: [...CMS_ALL],
  roles: ["password"],
};
