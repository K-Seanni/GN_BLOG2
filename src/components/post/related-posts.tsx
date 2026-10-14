import Link from "next/link";
import { getRelatedPosts } from "@/lib/data/public";
import { formatDate } from "@/lib/format";
import { postPath } from "@/lib/posts";

export async function RelatedPosts({
  postId,
  tags,
  authorId,
}: {
  postId: string;
  tags: string[];
  authorId: string;
}) {
  const posts = await getRelatedPosts(postId, tags, authorId);
  if (!posts.length) return null;

  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-4">
      <h2 id="related-heading" className="font-mono text-xs uppercase tracking-widest text-zinc-500">
        함께 읽으면 좋은 글
      </h2>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 sm:grid-cols-2 dark:border-white/10 dark:bg-white/10">
        {posts.map((post) =>
          post.author?.username ? (
            <li key={post.id} className="bg-zinc-50 dark:bg-black">
              <Link
                href={postPath(post.author.username, post.slug)}
                className="flex h-full flex-col gap-2 p-5 hover:bg-white dark:hover:bg-zinc-950"
              >
                <span className="font-medium leading-snug">{post.title}</span>
                {(post.summary || post.excerpt) && (
                  <span className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {post.summary || post.excerpt}
                  </span>
                )}
                <span className="mt-auto font-mono text-xs text-zinc-500">
                  @{post.author.username} · {formatDate(post.published_at)}
                </span>
              </Link>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
