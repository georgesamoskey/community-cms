import type { SitePage } from "@/builder/types";

export function publicPagePath(page: Pick<SitePage, "slug">): string {
  return page.slug ? `/${page.slug}` : "/";
}
