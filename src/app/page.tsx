import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { POST_CARD_SELECT } from "@/lib/posts";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PostList, type PostCardData } from "@/components/post-card";

const FEED_LIMIT = 30;

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { feed } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();
  const showFollowing = Boolean(user) && feed === "following";

  let posts: PostCardData[] = [];
  let empty = "아직 발행된 글이 없어요. 첫 글의 주인공이 되어 보세요.";

  if (showFollowing && user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const ids = (follows ?? []).map((f) => f.following_id);
    empty = ids.length
      ? "팔로우한 사람들이 아직 글을 쓰지 않았어요."
      : "아직 팔로우한 사람이 없어요. 마음에 드는 블로그를 팔로우해 보세요.";

    if (ids.length) {
      const { data } = await supabase
        .from("posts")
        .select(POST_CARD_SELECT)
        .eq("status", "published")
        .in("author_id", ids)
        .order("published_at", { ascending: false })
        .limit(FEED_LIMIT);
      posts = (data ?? []) as PostCardData[];
    }
  } else {
    const { data } = await supabase
      .from("posts")
      .select(POST_CARD_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(FEED_LIMIT);
    posts = (data ?? []) as PostCardData[];
  }

  return (
    <>
      {!user && (
        <section className="flex flex-col items-center gap-8 py-16 text-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
              생각을 기록하고, 함께 나누는 공간
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Google 계정 하나로 3초 만에 가입하고 바로 글을 쓰세요.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <GoogleSignInButton />
            <p className="text-sm text-zinc-500">처음이시면 Google 계정으로 바로 가입돼요.</p>
          </div>
        </section>
      )}

      <section className="flex flex-col">
        <nav className="flex gap-6 border-b border-black/5 dark:border-white/10">
          <FeedTab href="/" active={!showFollowing}>
            최신 글
          </FeedTab>
          {user && (
            <FeedTab href="/?feed=following" active={showFollowing}>
              팔로잉
            </FeedTab>
          )}
        </nav>
        <PostList posts={posts} empty={empty} />
      </section>
    </>
  );
}

function FeedTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`-mb-px border-b-2 py-3 text-sm font-medium ${
        active
          ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <Suspense fallback={<div className="h-96" />}>
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
