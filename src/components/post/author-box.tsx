import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicAuthor } from "@/lib/data/public";
import { Avatar } from "@/components/avatar";

function linkLabel(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    return pathname.length > 1 ? `${host}${pathname.replace(/\/$/, "")}` : host;
  } catch {
    return url;
  }
}

export function AuthorLinks({ author }: { author: Pick<PublicAuthor, "website_url" | "social_links"> }) {
  const links = [author.website_url, ...author.social_links].filter((v): v is string => Boolean(v));
  if (!links.length) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
      {links.map((url) => (
        <li key={url}>
          <a
            href={url}
            rel="me noopener noreferrer"
            target="_blank"
            className="text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
          >
            {linkLabel(url)}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function AuthorBox({ author, followSlot }: { author: PublicAuthor; followSlot?: ReactNode }) {
  const name = author.full_name ?? author.username;

  return (
    <section
      aria-label="작성자"
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white/70 p-6 sm:flex-row sm:items-start dark:border-white/10 dark:bg-zinc-900/60"
    >
      <Link href={`/@${author.username}`} className="shrink-0">
        <Avatar src={author.avatar_url} name={name} size={56} />
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/@${author.username}`} className="font-semibold hover:underline">
            {name}
          </Link>
          <span className="font-mono text-xs text-zinc-500">@{author.username}</span>
        </div>
        {author.bio && <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{author.bio}</p>}
        <AuthorLinks author={author} />
      </div>
      {followSlot}
    </section>
  );
}
