import "server-only";
import { renderArticle } from "@/lib/editor/content";
import type { getIndexablePosts } from "@/lib/data/public";
import { postPath } from "@/lib/posts";
import { absoluteUrl, SITE_LANGUAGE } from "./site";

type FeedPost = Awaited<ReturnType<typeof getIndexablePosts>>[number];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string) {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export function buildRss(input: { title: string; description: string; path: string; posts: FeedPost[] }) {
  const items = input.posts
    .map((post) => {
      const url = absoluteUrl(postPath(post.author.username, post.slug));
      const { html } = renderArticle(post.content);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <dc:creator>${escapeXml(post.author.full_name ?? post.author.username)}</dc:creator>
      ${post.published_at ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>` : ""}
      <description>${escapeXml(post.summary || post.excerpt || "")}</description>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}
      <content:encoded>${cdata(html)}</content:encoded>
    </item>`;
    })
    .join("\n");

  const lastBuild = input.posts[0]?.updated_at;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${escapeXml(absoluteUrl(input.path === "/feed.xml" ? "/" : input.path.replace(/\/feed\.xml$/, "")))}</link>
    <atom:link href="${escapeXml(absoluteUrl(input.path))}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(input.description)}</description>
    <language>${SITE_LANGUAGE}</language>
    ${lastBuild ? `<lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;
}

export function rssResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
