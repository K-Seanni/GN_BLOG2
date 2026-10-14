import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { CommentSection } from "@/components/comments/comment-section";
import { FollowButton } from "@/components/social/follow-button";
import { LikeButton } from "@/components/social/like-button";

export async function OwnerEditLink({ authorId, postId }: { authorId: string; postId: string }) {
  const viewer = await getCurrentUser();
  if (viewer?.id !== authorId) return null;

  return (
    <Link
      href={`/edit/${postId}`}
      className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
    >
      수정
    </Link>
  );
}

export async function LiveViewCount({ postId }: { postId: string }) {
  await getCurrentUser();
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("view_count").eq("id", postId).maybeSingle();
  if (!data) return null;

  return (
    <>
      <span aria-hidden>·</span>
      <span>조회 {formatCount(data.view_count)}</span>
    </>
  );
}

export async function AuthorFollow({ authorId }: { authorId: string }) {
  const viewer = await getCurrentUser();
  if (viewer?.id === authorId) return null;

  let following = false;
  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewer.id)
      .eq("following_id", authorId)
      .maybeSingle();
    following = Boolean(data);
  }

  return (
    <FollowButton
      targetId={authorId}
      following={following}
      canFollow={Boolean(viewer?.profile?.username)}
    />
  );
}

export async function LikeSlot({ postId }: { postId: string }) {
  const viewer = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: post }, { data: like }] = await Promise.all([
    supabase.from("posts").select("like_count").eq("id", postId).maybeSingle(),
    viewer
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("post_id", postId)
          .eq("user_id", viewer.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <LikeButton
      postId={postId}
      liked={Boolean(like)}
      count={post?.like_count ?? 0}
      canLike={Boolean(viewer?.profile?.username)}
    />
  );
}

export async function Comments({ postId, authorId }: { postId: string; authorId: string }) {
  const viewer = await getCurrentUser();

  return (
    <CommentSection
      postId={postId}
      postAuthorId={authorId}
      viewerId={viewer?.id ?? null}
      canComment={Boolean(viewer?.profile?.username)}
    />
  );
}
