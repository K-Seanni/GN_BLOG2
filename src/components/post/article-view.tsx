import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { TocItem } from "@/lib/editor/content";
import { formatDate } from "@/lib/format";
import { tagPath } from "@/lib/posts";
import { Avatar } from "@/components/avatar";

export type ArticleData = {
  title: string;
  summary: string | null;
  html: string;
  toc: TocItem[];
  tags: string[];
  reading_minutes: number;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string;
  author: { username: string; full_name: string | null; avatar_url: string | null };
};

type Props = {
  post: ArticleData;
  draft?: boolean;
  headerActions?: ReactNode;
  liveStats?: ReactNode;
};

const EDIT_THRESHOLD_MS = 10 * 60 * 1000;

export function ArticleView({ post, draft = false, headerActions, liveStats }: Props) {
  const authorName = post.author.full_name ?? post.author.username;
  const wasUpdated =
    post.published_at !== null &&
    new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > EDIT_THRESHOLD_MS;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="이동 경로" className="font-mono text-xs text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/@${post.author.username}`} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              @{post.author.username}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="max-w-[24ch] truncate text-zinc-700 dark:text-zinc-300">
            {post.title}
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-5">
        {draft && (
          <span className="self-start rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            임시저장된 글이에요. 나에게만 보여요.
          </span>
        )}
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/@${post.author.username}`} className="flex items-center gap-3">
            <Avatar src={post.author.avatar_url} name={authorName} size={40} />
            <span className="font-medium hover:underline">{authorName}</span>
          </Link>
          <span className="flex flex-wrap items-center gap-x-2 font-mono text-xs text-zinc-500">
            {post.published_at && (
              <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            )}
            {wasUpdated && (
              <>
                <span aria-hidden>·</span>
                <span>
                  수정 <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                </span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{post.reading_minutes}분 읽기</span>
            {liveStats}
          </span>
          {headerActions && <div className="ml-auto flex items-center gap-2">{headerActions}</div>}
        </div>
      </header>

      {post.summary && (
        <aside
          aria-label="요약"
          className="border-l-2 border-zinc-900 bg-white/70 px-5 py-4 dark:border-zinc-100 dark:bg-zinc-900/60"
        >
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-zinc-500">TL;DR</p>
          <p className="leading-7 text-zinc-800 dark:text-zinc-200">{post.summary}</p>
        </aside>
      )}

      {post.cover_image_url && (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
          <Image src={post.cover_image_url} alt="" fill priority className="object-cover" sizes="768px" />
        </div>
      )}

      <div className="relative">
        {post.toc.length >= 2 && <TableOfContents toc={post.toc} />}
        <div
          className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </div>

      {post.tags.length > 0 && <TagList tags={post.tags} />}
    </div>
  );
}

function TableOfContents({ toc }: { toc: TocItem[] }) {
  return (
    <nav
      aria-label="목차"
      className="mb-8 rounded-lg border border-black/10 bg-white/70 p-4 text-sm xl:absolute xl:-right-64 xl:top-0 xl:mb-0 xl:h-full xl:w-56 xl:border-0 xl:bg-transparent xl:p-0 dark:border-white/10 dark:bg-zinc-900/60 xl:dark:bg-transparent"
    >
      <div className="xl:sticky xl:top-24">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-zinc-500">목차</p>
        <ol className="flex flex-col gap-2">
          {toc.map((item) => (
            <li key={item.id} className={item.level === 3 ? "pl-3" : undefined}>
              <a
                href={`#${item.id}`}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

export function TagList({ tags, size = "md" }: { tags: string[]; size?: "sm" | "md" }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={tagPath(tag)}
            className={`inline-block rounded-md border border-black/10 bg-white font-mono text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100 ${
              size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
            }`}
          >
            #{tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
