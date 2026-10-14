import type { PublicAuthor, PublishedPost } from "@/lib/data/public";
import { postPath } from "@/lib/posts";
import { absoluteUrl, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_NAME, SITE_URL } from "./site";
import { postDescription, postImageUrl } from "./metadata";

type Schema = Record<string, unknown>;

export function JsonLd({ data }: { data: Schema | Schema[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const WEBSITE_ID = `${SITE_URL}/#website`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function siteSchemas(): Schema[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: SITE_LANGUAGE,
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon"), width: 64, height: 64 },
    },
  ];
}

export function personSchema(author: PublicAuthor): Schema {
  const url = absoluteUrl(`/@${author.username}`);
  const sameAs = [author.website_url, ...author.social_links].filter(Boolean);
  return {
    "@type": "Person",
    "@id": `${url}#person`,
    name: author.full_name ?? author.username,
    alternateName: `@${author.username}`,
    url,
    ...(author.avatar_url && { image: author.avatar_url }),
    ...(author.bio && { description: author.bio }),
    ...(sameAs.length && { sameAs }),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingSchema(post: PublishedPost): Schema {
  const url = absoluteUrl(postPath(post.author.username, post.slug));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title.slice(0, 110),
    description: postDescription(post),
    image: [postImageUrl(post)],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: personSchema(post.author),
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    inLanguage: SITE_LANGUAGE,
    wordCount: post.wordCount,
    timeRequired: `PT${post.reading_minutes}M`,
    ...(post.tags.length && { keywords: post.tags.join(", ") }),
  };
}

export function profilePageSchema(author: PublicAuthor): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`/@${author.username}`),
    dateCreated: author.created_at,
    mainEntity: personSchema(author),
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function collectionPageSchema(input: {
  name: string;
  path: string;
  description: string;
  items: { title: string; path: string }[];
}): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: absoluteUrl(input.path),
    description: input.description,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(item.path),
        name: item.title,
      })),
    },
  };
}
