import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { renderContent } from "@/lib/editor/content";
import { formatCount, formatDate } from "@/lib/format";
import { decodeParam } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { CommentSection } from "@/components/comments/comment-section";
import { LikeButton } from "@/components/social/like-button";
import { ViewTracker } from "@/components/social/view-tracker";

async function Post({ params }: { params: PageProps<"/u/[username]/[slug]">["params"] }) {
  const { username, slug } = await params;
  const viewer = await getCurrentUser();
  const supabase = await createClient();

  const { data: author } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", decodeParam(username).toLowerCase())
    .maybeSingle();

  if (!author?.username) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, cover_image_url, status, published_at, view_count, like_count")
    .eq("author_id", author.id)
    .eq("slug", decodeParam(slug))
    .maybeSingle();

  if (!post) notFound();

  const { data: like } = viewer
    ? await supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", viewer.id)
        .maybeSingle()
    : { data: null };

  const html = renderContent(post.content);
  const isOwner = viewer?.id === author.id;
  const isPublished = post.status === "published";
  const authorName = author.full_name ?? author.username;
  const canInteract = Boolean(viewer?.profile?.username);

  return (
    <article className="flex flex-col gap-8">
      {isPublished && <ViewTracker postId={post.id} />}

      <header className="flex flex-col gap-5">
        {!isPublished && (
          <span className="self-start rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            임시저장된 글이에요. 나에게만 보여요.
          </span>
        )}
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-3">
          <Link href={`/@${author.username}`} className="flex items-center gap-3">
            <Avatar src={author.avatar_url} name={authorName} size={40} />
            <span className="flex flex-col">
              <span className="font-medium hover:underline">{authorName}</span>
              <span className="text-sm text-zinc-500">
                {formatDate(post.published_at)}
                {isPublished && ` · 조회 ${formatCount(post.view_count)}`}
              </span>
            </span>
          </Link>
          {isOwner && (
            <Link
              href={`/edit/${post.id}`}
              className="ml-auto rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
            >
              수정
            </Link>
          )}
        </div>
      </header>

      {post.cover_image_url && (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
          <Image src={post.cover_image_url} alt="" fill priority className="object-cover" sizes="768px" />
        </div>
      )}

      <div
        className="prose prose-zinc max-w-none dark:prose-invert prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {isPublished && (
        <>
          <div className="flex justify-center border-y border-black/5 py-6 dark:border-white/10">
            <LikeButton
              postId={post.id}
              liked={Boolean(like)}
              count={post.like_count}
              canLike={canInteract}
            />
          </div>
          <CommentSection
            postId={post.id}
            postAuthorId={author.id}
            viewerId={viewer?.id ?? null}
            canComment={canInteract}
          />
        </>
      )}
    </article>
  );
}

export default function PostPage({ params }: PageProps<"/u/[username]/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<div className="h-96" />}>
        <Post params={params} />
      </Suspense>
    </main>
  );
}
