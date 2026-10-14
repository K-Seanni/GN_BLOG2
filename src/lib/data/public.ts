import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { renderArticle } from "@/lib/editor/content";
import { POST_CARD_SELECT } from "@/lib/posts";
import { createPublicClient } from "@/lib/supabase/public";
import type { PostCardData } from "@/components/post-card";
import { cacheTags } from "./cache-tags";

const AUTHOR_FIELDS = "id, username, full_name, avatar_url, bio, website_url, social_links, created_at";

export type PublicAuthor = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  social_links: string[];
  created_at: string;
};

export async function getPublicProfile(username: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.user(username));

  const { data } = await createPublicClient()
    .from("profiles")
    .select(AUTHOR_FIELDS)
    .eq("username", username)
    .maybeSingle();

  return data?.username ? (data as PublicAuthor) : null;
}

export async function getPublishedPost(username: string, slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.post(username, slug), cacheTags.user(username));

  const { data } = await createPublicClient()
    .from("posts")
    .select(
      `id, title, slug, content, summary, excerpt, seo_title, seo_description, cover_image_url,
       og_image_url, tags, reading_minutes, canonical_url, noindex, published_at, updated_at,
       author:profiles!posts_author_id_fkey!inner(${AUTHOR_FIELDS})`,
    )
    .eq("author.username", username)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data?.author) return null;

  const { content, ...rest } = data;
  const { html, toc } = renderArticle(content);
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

  return { ...rest, author: data.author as PublicAuthor, html, toc, wordCount };
}

export type PublishedPost = NonNullable<Awaited<ReturnType<typeof getPublishedPost>>>;

export async function getAuthorPublishedPosts(authorId: string, username: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts, cacheTags.user(username));

  const { data } = await createPublicClient()
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  return (data ?? []) as PostCardData[];
}

export async function getPostsByTag(tag: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts);

  const { data } = await createPublicClient()
    .from("posts")
    .select(POST_CARD_SELECT)
    .eq("status", "published")
    .contains("tags", [tag])
    .order("published_at", { ascending: false })
    .limit(50);

  return (data ?? []) as PostCardData[];
}

export async function getPopularTags(limit = 30) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts);

  const { data } = await createPublicClient().rpc("popular_tags", { max_count: limit });
  return data ?? [];
}

export async function getRelatedPosts(postId: string, tags: string[], authorId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts);

  const supabase = createPublicClient();
  const base = () =>
    supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("status", "published")
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .limit(4);

  const { data: byTag } = tags.length ? await base().overlaps("tags", tags) : { data: [] };
  const related = (byTag ?? []) as PostCardData[];
  if (related.length >= 4) return related;

  const { data: byAuthor } = await base().eq("author_id", authorId);
  const seen = new Set(related.map((p) => p.id));
  for (const post of (byAuthor ?? []) as PostCardData[]) {
    if (related.length >= 4) break;
    if (!seen.has(post.id)) related.push(post);
  }
  return related;
}

export async function getIndexablePosts(limit = 1000, authorId?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts);

  let query = createPublicClient()
    .from("posts")
    .select(
      "id, title, slug, summary, excerpt, content, tags, published_at, updated_at, author:profiles!posts_author_id_fkey!inner(username, full_name)",
    )
    .eq("status", "published")
    .eq("noindex", false);
  if (authorId) query = query.eq("author_id", authorId);

  const { data } = await query.order("published_at", { ascending: false }).limit(limit);

  return (data ?? []).flatMap((post) =>
    post.author?.username ? [{ ...post, author: { ...post.author, username: post.author.username } }] : [],
  );
}

export async function getPublicProfiles() {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.posts);

  const { data } = await createPublicClient()
    .from("profiles")
    .select("username, updated_at")
    .not("username", "is", null);

  return (data ?? []).flatMap((p) => (p.username ? [{ username: p.username, updated_at: p.updated_at }] : []));
}
