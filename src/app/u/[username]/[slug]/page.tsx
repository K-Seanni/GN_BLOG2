import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublishedPost } from "@/lib/data/public";
import { renderArticle } from "@/lib/editor/content";
import { decodeParam, postPath } from "@/lib/posts";
import { blogPostingSchema, breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";
import { NOINDEX, postMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import { ArticleView } from "@/components/post/article-view";
import { AuthorBox } from "@/components/post/author-box";
import { CopyLinkButton } from "@/components/post/copy-link-button";
import { RelatedPosts } from "@/components/post/related-posts";
import { AuthorFollow, Comments, LikeSlot, LiveViewCount, OwnerEditLink } from "@/components/post/viewer";
import { ViewTracker } from "@/components/social/view-tracker";

type Params = PageProps<"/u/[username]/[slug]">["params"];

async function resolveParams(params: Params) {
  const { username, slug } = await params;
  return { username: decodeParam(username).toLowerCase(), slug: decodeParam(slug) };
}

export async function generateMetadata({ params }: PageProps<"/u/[username]/[slug]">): Promise<Metadata> {
  const { username, slug } = await resolveParams(params);
  const post = await getPublishedPost(username, slug);
  if (!post) return { title: "글", robots: NOINDEX };
  return postMetadata(post);
}

async function PublishedArticle({ params }: { params: Params }) {
  const { username, slug } = await resolveParams(params);
  const post = await getPublishedPost(username, slug);

  if (!post) {
    return (
      <Suspense fallback={<div className="h-96" />}>
        <DraftPreview username={username} slug={slug} />
      </Suspense>
    );
  }

  const path = postPath(post.author.username, post.slug);

  return (
    <article className="flex flex-col gap-10">
      <JsonLd
        data={[
          blogPostingSchema(post),
          breadcrumbSchema([
            { name: "GN Blog", path: "/" },
            { name: `@${post.author.username}`, path: `/@${post.author.username}` },
            { name: post.title, path },
          ]),
        ]}
      />
      <ViewTracker postId={post.id} />

      <ArticleView
        post={post}
        headerActions={
          <Suspense>
            <OwnerEditLink authorId={post.author.id} postId={post.id} />
          </Suspense>
        }
        liveStats={
          <Suspense>
            <LiveViewCount postId={post.id} />
          </Suspense>
        }
      />

      <div className="flex flex-wrap items-center justify-center gap-3 border-y border-black/5 py-6 dark:border-white/10">
        <Suspense fallback={<div className="h-10 w-28" />}>
          <LikeSlot postId={post.id} />
        </Suspense>
        <CopyLinkButton url={absoluteUrl(path)} />
      </div>

      <AuthorBox
        author={post.author}
        followSlot={
          <Suspense>
            <AuthorFollow authorId={post.author.id} />
          </Suspense>
        }
      />

      <RelatedPosts postId={post.id} tags={post.tags} authorId={post.author.id} />

      <Suspense fallback={<div className="h-40" />}>
        <Comments postId={post.id} authorId={post.author.id} />
      </Suspense>
    </article>
  );
}

async function DraftPreview({ username, slug }: { username: string; slug: string }) {
  const viewer = await getCurrentUser();
  if (!viewer?.profile?.username || viewer.profile.username !== username) notFound();

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, summary, content, tags, reading_minutes, cover_image_url, published_at, updated_at")
    .eq("author_id", viewer.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!post) notFound();

  const { html, toc } = renderArticle(post.content);

  return (
    <article>
      <ArticleView
        draft
        post={{
          ...post,
          html,
          toc,
          author: {
            username,
            full_name: viewer.profile.full_name,
            avatar_url: viewer.profile.avatar_url,
          },
        }}
        headerActions={<OwnerEditLink authorId={viewer.id} postId={post.id} />}
      />
    </article>
  );
}

export default function PostPage({ params }: PageProps<"/u/[username]/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<div className="h-96" />}>
        <PublishedArticle params={params} />
      </Suspense>
    </main>
  );
}
