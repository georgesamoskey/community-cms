import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderPageBlocks } from "@/builder/render-blocks";
import {
  findPageBySlug,
  getPublicSiteDocument,
  publicPagePath,
} from "@/lib/site-store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<{ preview?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const { doc } = await getPublicSiteDocument(sp.preview === "1");
  const page = findPageBySlug(doc, slug);
  if (!page) return {};
  return {
    title: page.seo.title || page.title,
    description: page.seo.description,
    robots: page.seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: page.seo.ogImage
      ? { images: [{ url: page.seo.ogImage }] }
      : undefined,
  };
}

export default async function DynamicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (slug[0] === "cms-admin" || slug[0] === "api" || slug[0] === "uploads" || slug[0] === "register" || slug[0] === "forgot-password") {
    notFound();
  }
  // /blog/[article] géré par app/blog/[slug]
  if (slug[0] === "blog" && slug.length > 1) notFound();

  const sp = searchParams ? await searchParams : {};
  const { doc, preview } = await getPublicSiteDocument(sp.preview === "1");
  const page = findPageBySlug(doc, slug);
  if (!page || (page.status === "draft" && !preview)) notFound();

  return (
    <>
      {preview && (
        <div className="bg-sun-400 px-4 py-2 text-center text-sm font-semibold text-ink-900">
          Mode prévisualisation (brouillon) —{" "}
          <a href={publicPagePath(page)} className="underline">
            voir la version publiée
          </a>
        </div>
      )}
      <RenderPageBlocks blocks={page.blocks} doc={doc} />
    </>
  );
}
