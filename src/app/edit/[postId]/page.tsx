import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/editor/post-form";

async function EditPost({ params }: { params: PageProps<"/edit/[postId]">["params"] }) {
  const { postId } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, cover_image_url, status")
    .eq("id", postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <PostForm
      userId={user.id}
      post={{ ...post, content: post.content as JSONContent }}
    />
  );
}

export default function EditPage({ params }: PageProps<"/edit/[postId]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Suspense fallback={<div className="h-96" />}>
        <EditPost params={params} />
      </Suspense>
    </main>
  );
}
