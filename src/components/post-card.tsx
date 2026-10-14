import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { TagList } from "@/components/post/article-view";
import { formatCount, formatDate } from "@/lib/format";
import { postPath } from "@/lib/posts";

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  summary: string | null;
  tags: string[];
  cover_image_url: string | null;
  status: string;
  published_at: string | null;
  updated_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  author: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

type Props = {
  post: PostCardData;
  showAuthor?: boolean;
  editable?: boolean;
};

export function PostCard({ post, showAuthor = true, editable = false }: Props) {
  const username = post.author?.username;
  const authorName = post.author?.full_name ?? username ?? "";
  const isDraft = post.status !== "published";
  const href = isDraft || !username ? `/edit/${post.id}` : postPath(username, post.slug);

  return (
    <article className="flex gap-6 border-b border-black/5 py-6 last:border-b-0 dark:border-white/10">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {showAuthor && username && (
          <Link href={`/@${username}`} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Avatar src={post.author?.avatar_url} name={authorName} size={22} />
            {authorName}
          </Link>
        )}
        <Link href={href} className="group flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight group-hover:underline">
            {isDraft && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                임시저장
              </span>
            )}
            <span className="truncate">{post.title}</span>
          </h2>
          {(post.summary || post.excerpt) && (
            <p className="line-clamp-2 text-zinc-600 dark:text-zinc-400">{post.summary || post.excerpt}</p>
          )}
        </Link>
        {post.tags.length > 0 && <TagList tags={post.tags} size="sm" />}
        <div className="flex items-center gap-3 font-mono text-xs text-zinc-500">
          <span>{formatDate(isDraft ? post.updated_at : post.published_at)}</span>
          {!isDraft && (
            <>
              <span>조회 {formatCount(post.view_count)}</span>
              <span>좋아요 {formatCount(post.like_count)}</span>
              <span>댓글 {formatCount(post.comment_count)}</span>
            </>
          )}
          {editable && (
            <Link href={`/edit/${post.id}`} className="underline underline-offset-2">
              수정
            </Link>
          )}
        </div>
      </div>
      {post.cover_image_url && (
        <Link href={href} className="relative hidden h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:block dark:bg-zinc-900">
          <Image src={post.cover_image_url} alt="" fill className="object-cover" sizes="160px" />
        </Link>
      )}
    </article>
  );
}

export function PostList({
  posts,
  showAuthor,
  editable,
  empty,
}: {
  posts: PostCardData[];
  showAuthor?: boolean;
  editable?: boolean;
  empty: string;
}) {
  if (posts.length === 0) {
    return <p className="py-16 text-center text-zinc-500">{empty}</p>;
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showAuthor={showAuthor} editable={editable} />
      ))}
    </div>
  );
}
