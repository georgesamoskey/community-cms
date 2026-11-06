import { redirect } from "next/navigation";

/**
 * Le studio d'édition a été migré dans community-backoffice
 * (`/admin/cms`, code réel — plus d'iframe). Cette route ne fait plus
 * que rediriger pour éviter que deux éditeurs divergent sur deux
 * copies locales (`src/content/_site/*`) différentes.
 */
export default function CmsAdminRedirectPage() {
  const backoffice =
    process.env.NEXT_PUBLIC_BACKOFFICE_URL?.replace(/\/$/, "") ||
    "http://localhost:3001";
  redirect(`${backoffice}/admin/cms`);
}
