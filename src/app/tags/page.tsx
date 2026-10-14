import type { Metadata } from "next";
import Link from "next/link";
import { getPopularTags } from "@/lib/data/public";
import { tagPath } from "@/lib/posts";
import { breadcrumbSchema, collectionPageSchema, JsonLd } from "@/lib/seo/json-ld";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo/site";

const description = "GN Blog에서 많이 쓰인 주제별 태그 모음. 관심 있는 주제의 글을 한눈에 찾아보세요.";

export const metadata: Metadata = {
  title: "태그",
  description,
  alternates: { canonical: absoluteUrl("/tags") },
  openGraph: { title: "태그", description, url: absoluteUrl("/tags"), images: [DEFAULT_OG_IMAGE] },
};

export default async function TagsPage() {
  const tags = await getPopularTags(100);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <JsonLd
        data={[
          collectionPageSchema({
            name: "태그",
            path: "/tags",
            description,
            items: tags.map(({ tag }) => ({ title: `#${tag}`, path: tagPath(tag) })),
          }),
          breadcrumbSchema([
            { name: "GN Blog", path: "/" },
            { name: "태그", path: "/tags" },
          ]),
        ]}
      />
      <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">tags</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">주제별로 찾아보기</h1>

      {tags.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 sm:grid-cols-3 dark:border-white/10 dark:bg-white/10">
          {tags.map(({ tag, post_count }) => (
            <li key={tag} className="bg-zinc-50 dark:bg-black">
              <Link
                href={tagPath(tag)}
                className="flex items-baseline justify-between gap-2 px-4 py-3 font-mono text-sm hover:bg-white dark:hover:bg-zinc-950"
              >
                <span className="truncate">#{tag}</span>
                <span className="text-xs text-zinc-500">{post_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-zinc-500">아직 태그가 달린 글이 없어요.</p>
      )}
    </main>
  );
}
