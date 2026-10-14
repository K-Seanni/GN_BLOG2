import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { PostForm } from "@/components/editor/post-form";

async function NewPost() {
  const user = await requireUser();
  return <PostForm userId={user.id} />;
}

export default function WritePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Suspense fallback={<div className="h-96" />}>
        <NewPost />
      </Suspense>
    </main>
  );
}
