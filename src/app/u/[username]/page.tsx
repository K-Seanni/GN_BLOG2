import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { decodeParam, POST_CARD_SELECT } from "@/lib/posts";
import { formatCount } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { PostList, type PostCardData } from "@/components/post-card";
import { FollowButton } from "@/components/social/follow-button";

async function Profile({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  const { username } = await params;
  const viewer = await getCurrentUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio")
    .eq("username", decodeParam(username).toLowerCase())
    .maybeSingle();

  if (!profile?.username) notFound();

  const isOwner = viewer?.id === profile.id;

  const [followers, following, isFollowing, posts] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    viewer && !isOwner
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", viewer.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("author_id", profile.id)
      .order("status", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: true })
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  const name = profile.full_name ?? profile.username;

  return (
    <>
      <section className="flex flex-col gap-5 border-b border-black/5 pb-8 sm:flex-row sm:items-center dark:border-white/10">
        <Avatar src={profile.avatar_url} name={name} size={88} />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <span className="text-zinc-500">@{profile.username}</span>
          </div>
          {profile.bio && <p className="text-zinc-600 dark:text-zinc-400">{profile.bio}</p>}
          <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>
              팔로워 <b className="text-zinc-900 dark:text-zinc-100">{formatCount(followers.count ?? 0)}</b>
            </span>
            <span>
              팔로잉 <b className="text-zinc-900 dark:text-zinc-100">{formatCount(following.count ?? 0)}</b>
            </span>
          </div>
        </div>
        {!isOwner && (
          <FollowButton
            targetId={profile.id}
            following={Boolean(isFollowing.data)}
            canFollow={Boolean(viewer?.profile?.username)}
          />
        )}
      </section>

      <PostList
        posts={(posts.data ?? []) as PostCardData[]}
        showAuthor={false}
        editable={isOwner}
        empty={isOwner ? "첫 글을 써보세요." : "아직 발행된 글이 없어요."}
      />
    </>
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
