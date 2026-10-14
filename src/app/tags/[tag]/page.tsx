import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getPostsByTag } from "@/lib/data/public";
import { decodeParam, postPath, tagPath } from "@/lib/posts";
import { breadcrumbSchema, collectionPageSchema, JsonLd } from "@/lib/seo/json-ld";
import { NOINDEX } from "@/lib/seo/metadata";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo/site";
import { normalizeTag } from "@/lib/slug";
import { PostList } from "@/components/post-card";

type Params = PageProps<"/tags/[tag]">["params"];

async function resolveTag(params: Params) {
  const { tag } = await params;
  return normalizeTag(decodeParam(tag));
}

function describe(tag: string, count: number) {
  return `#${tag} 태그가 달린 글 ${count}개. GN Blog에서 ${tag} 관련 글을 모아 보세요.`;
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const tag = await resolveTag(params);
  const posts = tag ? await getPostsByTag(tag) : [];
  const title = `#${tag}`;
  const url = absoluteUrl(tagPath(tag));

  return {
    title,
    description: describe(tag, posts.length),
    alternates: { canonical: url },
    robots: posts.length ? undefined : NOINDEX,
    openGraph: { title, description: describe(tag, posts.length), url, images: [DEFAULT_OG_IMAGE] },
  };
}

async function TagPosts({ params }: { params: Params }) {
  const tag = await resolveTag(params);
  const posts = tag ? await getPostsByTag(tag) : [];

  return (
    <>
      <JsonLd
        data={[
          collectionPageSchema({
            name: `#${tag}`,
            path: tagPath(tag),
            description: describe(tag, posts.length),
            items: posts.flatMap((p) =>
              p.author?.username ? [{ title: p.title, path: postPath(p.author.username, p.slug) }] : [],
            ),
          }),
          breadcrumbSchema([
            { name: "GN Blog", path: "/" },
            { name: "태그", path: "/tags" },
            { name: `#${tag}`, path: tagPath(tag) },
          ]),
        ]}
      />
      <nav aria-label="이동 경로" className="font-mono text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">home</Link>
        {" / "}
        <Link href="/tags" className="hover:text-zinc-900 dark:hover:text-zinc-100">tags</Link>
      </nav>
      <h1 className="mt-3 font-mono text-3xl font-semibold tracking-tight">#{tag}</h1>
      <p className="mt-2 text-sm text-zinc-500">글 {posts.length}개</p>
      <PostList posts={posts} empty="이 태그가 달린 글이 아직 없어요." />
    </>
  );
}

export default function TagPage({ params }: PageProps<"/tags/[tag]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<div className="h-40" />}>
        <TagPosts params={params} />
      </Suspense>
    </main>
  );
}
