import type { Metadata } from "next";
import type { PublicAuthor, PublishedPost } from "@/lib/data/public";
import { postPath } from "@/lib/posts";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME } from "./site";

export const NOINDEX: Metadata["robots"] = { index: false, follow: false };

export function postDescription(post: Pick<PublishedPost, "seo_description" | "summary" | "excerpt">) {
  return post.seo_description || post.summary || post.excerpt || "";
}

export function postImageUrl(post: Pick<PublishedPost, "og_image_url" | "cover_image_url" | "slug" | "author">) {
  return (
    post.og_image_url ||
    post.cover_image_url ||
    absoluteUrl(`/api/og/post?u=${post.author.username}&s=${encodeURIComponent(post.slug)}`)
  );
}

export function postMetadata(post: PublishedPost): Metadata {
  const title = post.seo_title || post.title;
  const description = postDescription(post);
  const url = absoluteUrl(postPath(post.author.username, post.slug));
  const image = { url: postImageUrl(post), width: 1200, height: 630, alt: post.title };
  const authorName = post.author.full_name ?? post.author.username;

  return {
    title,
    description,
    keywords: post.tags,
    authors: [{ name: authorName, url: absoluteUrl(`/@${post.author.username}`) }],
    alternates: {
      canonical: post.canonical_url || url,
      types: { "application/rss+xml": absoluteUrl(`/@${post.author.username}/feed.xml`) },
    },
    robots: post.noindex ? NOINDEX : undefined,
    openGraph: {
      type: "article",
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title,
      description,
      images: [image],
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: [absoluteUrl(`/@${post.author.username}`)],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export function profileMetadata(author: PublicAuthor): Metadata {
  const name = author.full_name ?? author.username;
  const title = `${name} (@${author.username})`;
  const description = author.bio || `${name}님의 블로그입니다. ${SITE_NAME}에서 글을 읽고 팔로우해 보세요.`;
  const url = absoluteUrl(`/@${author.username}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": absoluteUrl(`/@${author.username}/feed.xml`) },
    },
    openGraph: {
      type: "profile",
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title,
      description,
      username: author.username,
      images: [author.avatar_url ? { url: author.avatar_url, alt: name } : DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary", title, description },
  };
}
