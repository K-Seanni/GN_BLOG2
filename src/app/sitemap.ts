import type { MetadataRoute } from "next";
import { getIndexablePosts, getPopularTags, getPublicProfiles } from "@/lib/data/public";
import { postPath, tagPath } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, profiles, tags] = await Promise.all([
    getIndexablePosts(),
    getPublicProfiles(),
    getPopularTags(200),
  ]);

  const latest = posts[0]?.updated_at;

  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/tags"), lastModified: latest, changeFrequency: "weekly", priority: 0.5 },
    ...posts.map((post) => ({
      url: absoluteUrl(postPath(post.author.username, post.slug)),
      lastModified: post.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...profiles.map((profile) => ({
      url: absoluteUrl(`/@${profile.username}`),
      lastModified: profile.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...tags.map(({ tag }) => ({
      url: absoluteUrl(tagPath(tag)),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
