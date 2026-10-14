import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getPopularTags } from "@/lib/data/public";
import { SITE_URL } from "@/lib/seo/site";
import { PostForm } from "@/components/editor/post-form";

async function NewPost() {
  const [user, popular] = await Promise.all([requireUser(), getPopularTags(30)]);
  return (
    <PostForm
      userId={user.id}
      username={user.username}
      siteHost={new URL(SITE_URL).host}
      suggestedTags={popular.map((t) => t.tag)}
    />
  );
}

export default function WritePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
      <Suspense fallback={<div className="h-96" />}>
        <NewPost />
      </Suspense>
    </main>
  );
}
