import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostReader from "@/components/PostReader";
import { getPosts } from "@/lib/content";
import { renderPost } from "@/lib/markdown";

// Fully static: slugs come from the build's post set (drafts included only
// when SHOW_DRAFTS=1), and anything else 404s without touching the fs at
// request time. Publishing = flip hide: false, push, deploy hook rebuilds.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — thought sandboxes`,
    description: post.description || undefined,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPosts().find((p) => p.slug === slug);
  if (!post) notFound();

  const { html, outline } = renderPost(post.body);

  return (
    <PostReader
      post={{
        slug: post.slug,
        file: post.file,
        title: post.title,
        description: post.description,
        tags: post.tags,
        date: post.date,
        author: post.author,
        hide: post.hide,
        image: post.image,
        words: post.words,
        body: post.body,
        html,
        outline,
      }}
    />
  );
}
