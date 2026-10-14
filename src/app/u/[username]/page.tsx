import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorPublishedPosts, getPublicProfile } from "@/lib/data/public";
import { formatCount } from "@/lib/format";
import { decodeParam, POST_CARD_SELECT, postPath } from "@/lib/posts";
import { breadcrumbSchema, collectionPageSchema, JsonLd, profilePageSchema } from "@/lib/seo/json-ld";
import { NOINDEX, profileMetadata } from "@/lib/seo/metadata";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { PostList, type PostCardData } from "@/components/post-card";
import { AuthorLinks } from "@/components/post/author-box";
import { AuthorFollow } from "@/components/post/viewer";

type Params = PageProps<"/u/[username]">["params"];

async function resolveUsername(params: Params) {
  const { username } = await params;
  return decodeParam(username).toLowerCase();
}

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const author = await getPublicProfile(await resolveUsername(params));
  if (!author) return { title: "블로그", robots: NOINDEX };
  return profileMetadata(author);
}

async function Profile({ params }: { params: Params }) {
  const author = await getPublicProfile(await resolveUsername(params));
  if (!author) notFound();

  const posts = await getAuthorPublishedPosts(author.id, author.username);
  const name = author.full_name ?? author.username;

  return (
    <>
      <JsonLd
        data={[
          profilePageSchema(author),
          collectionPageSchema({
            name: `${name}의 글`,
            path: `/@${author.username}`,
            description: author.bio ?? `${name}님이 쓴 글 목록`,
            items: posts.map((p) => ({ title: p.title, path: postPath(author.username, p.slug) })),
          }),
          breadcrumbSchema([
            { name: "GN Blog", path: "/" },
            { name: `@${author.username}`, path: `/@${author.username}` },
          ]),
        ]}
      />

      <section className="flex flex-col gap-5 border-b border-black/5 pb-8 sm:flex-row sm:items-center dark:border-white/10">
        <Avatar src={author.avatar_url} name={name} size={88} />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <span className="font-mono text-sm text-zinc-500">@{author.username}</span>
          </div>
          {author.bio && <p className="text-zinc-600 dark:text-zinc-400">{author.bio}</p>}
          <AuthorLinks author={author} />
          <Suspense fallback={<div className="h-5" />}>
            <FollowCounts authorId={author.id} />
          </Suspense>
        </div>
        <Suspense>
          <AuthorFollow authorId={author.id} />
        </Suspense>
      </section>

      <Suspense>
        <OwnerDrafts authorId={author.id} />
      </Suspense>

      <PostList posts={posts} showAuthor={false} empty="아직 발행된 글이 없어요." />
    </>
  );
}

async function FollowCounts({ authorId }: { authorId: string }) {
  await getCurrentUser();
  const supabase = await createClient();
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", authorId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", authorId),
  ]);

  return (
    <div className="flex gap-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
      <span>
        팔로워 <b className="text-zinc-900 dark:text-zinc-100">{formatCount(followers.count ?? 0)}</b>
      </span>
      <span>
        팔로잉 <b className="text-zinc-900 dark:text-zinc-100">{formatCount(following.count ?? 0)}</b>
      </span>
    </div>
  );
}

async function OwnerDrafts({ authorId }: { authorId: string }) {
  const viewer = await getCurrentUser();
  if (viewer?.id !== authorId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("author_id", authorId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  const drafts = (data ?? []) as PostCardData[];
  if (!drafts.length) return null;

  return (
    <section className="border-b border-black/5 dark:border-white/10">
      <h2 className="pt-6 font-mono text-xs uppercase tracking-widest text-zinc-500">
        임시저장 {drafts.length} · 나에게만 보여요
      </h2>
      <PostList posts={drafts} showAuthor={false} editable empty="" />
    </section>
  );
}

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Suspense fallback={<div className="h-40" />}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}
