import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSiteDocument } from "@/lib/site-store";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const { doc, preview } = await getPublicSiteDocument(sp.preview === "1");
  const post = doc.blog.find(
    (p) => p.slug === slug && (p.status === "published" || preview),
  );
  if (!post) return {};
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
  };
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const { doc, preview } = await getPublicSiteDocument(sp.preview === "1");
  const post = doc.blog.find(
    (p) => p.slug === slug && (p.status === "published" || preview),
  );
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm text-ink-700/50">{post.date}</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">
        {post.title}
      </h1>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-ink-700/85">
        {post.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}
