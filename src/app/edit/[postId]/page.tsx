import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { requireUser } from "@/lib/auth";
import { getPopularTags } from "@/lib/data/public";
import { SITE_URL } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/editor/post-form";

async function EditPost({ params }: { params: PageProps<"/edit/[postId]">["params"] }) {
  const { postId } = await params;
  const [user, popular] = await Promise.all([requireUser(), getPopularTags(30)]);
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, slug, content, cover_image_url, status, published_at, summary, seo_title, seo_description, tags, og_image_url, canonical_url, noindex",
    )
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <PostForm
      userId={user.id}
      username={user.username}
      siteHost={new URL(SITE_URL).host}
      suggestedTags={popular.map((t) => t.tag)}
      post={{ ...post, content: post.content as JSONContent }}
    />
  );
}

export default function EditPage({ params }: PageProps<"/edit/[postId]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
      <Suspense fallback={<div className="h-96" />}>
        <EditPost params={params} />
      </Suspense>
    </main>
  );
}
