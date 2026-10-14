import Link from "next/link";
import { deleteComment } from "@/app/actions/comments";
import { Avatar } from "@/components/avatar";
import { CommentForm } from "@/components/comments/comment-form";
import { ReplyToggle } from "@/components/comments/reply-toggle";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Props = {
  postId: string;
  postAuthorId: string;
  viewerId: string | null;
  canComment: boolean;
};

type CommentRow = {
  id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  author: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

export async function CommentSection({ postId, postAuthorId, viewerId, canComment }: Props) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(
      "id, parent_id, author_id, body, created_at, author:profiles!comments_author_id_fkey(username, full_name, avatar_url)",
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const comments = (data ?? []) as CommentRow[];
  const roots = comments.filter((c) => !c.parent_id);
  const replies = Map.groupBy(
    comments.filter((c) => c.parent_id),
    (c) => c.parent_id!,
  );

  const canDelete = (c: CommentRow) =>
    viewerId !== null && (viewerId === c.author_id || viewerId === postAuthorId);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">댓글 {comments.length}</h2>

      {canComment ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="rounded-lg bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {viewerId ? (
            <>
              댓글을 쓰려면 <Link href="/onboarding" className="underline">아이디를 먼저 설정</Link>해 주세요.
            </>
          ) : (
            "로그인하면 댓글을 남길 수 있어요."
          )}
        </p>
      )}

      <ul className="flex flex-col gap-6">
        {roots.map((comment) => (
          <li key={comment.id} className="flex flex-col gap-4">
            <CommentItem comment={comment} deletable={canDelete(comment)} />
            <div className="ml-10 flex flex-col gap-4">
              {(replies.get(comment.id) ?? []).map((reply) => (
                <CommentItem key={reply.id} comment={reply} deletable={canDelete(reply)} />
              ))}
              {canComment && <ReplyToggle postId={postId} parentId={comment.id} />}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommentItem({ comment, deletable }: { comment: CommentRow; deletable: boolean }) {
  const username = comment.author?.username;
  const nickname = username ? `@${username}` : "알 수 없음";

  return (
    <div className="flex gap-3">
      <Avatar src={comment.author?.avatar_url} name={nickname} size={28} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 text-sm">
          {username ? (
            <Link href={`/@${username}`} className="font-medium hover:underline">
              {nickname}
            </Link>
          ) : (
            <span className="font-medium">{nickname}</span>
          )}
          <span className="text-xs text-zinc-500">{formatDateTime(comment.created_at)}</span>
          {deletable && (
            <form action={deleteComment} className="ml-auto">
              <input type="hidden" name="comment_id" value={comment.id} />
              <button type="submit" className="text-xs text-zinc-400 hover:text-red-600">
                삭제
              </button>
            </form>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p>
      </div>
    </div>
  );
}
