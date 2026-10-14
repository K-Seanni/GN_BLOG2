import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo/site";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { POST_CARD_SELECT } from "@/lib/posts";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PostList, type PostCardData } from "@/components/post-card";
import { PeopleList, type Person } from "@/components/social/people-list";

const FEED_LIMIT = 30;

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": absoluteUrl("/feed.xml") },
  },
};

const PROFILE_FIELDS = "id, username, full_name, avatar_url";

function asPeople(
  rows: { person: Person | Person[] | null }[] | null,
): Person[] {
  return (rows ?? []).flatMap((row) => {
    const person = Array.isArray(row.person) ? row.person[0] : row.person;
    return person ? [person] : [];
  });
}

async function Feed({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { feed } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();
  const peopleFeed = feed === "followers" ? "followers" : feed === "following" ? "following" : null;
  const showPeople = Boolean(user) && peopleFeed;

  let posts: PostCardData[] = [];
  let people: Person[] = [];
  const empty = "아직 발행된 글이 없어요. 첫 글의 주인공이 되어 보세요.";

  if (showPeople && user && peopleFeed) {
    const following = peopleFeed === "following";
    const { data } = await supabase
      .from("follows")
      .select(
        following
          ? `person:profiles!follows_following_id_fkey(${PROFILE_FIELDS})`
          : `person:profiles!follows_follower_id_fkey(${PROFILE_FIELDS})`,
      )
      .eq(following ? "follower_id" : "following_id", user.id)
      .order("created_at", { ascending: false });
    people = asPeople(data as { person: Person | Person[] | null }[] | null);
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
          <FeedTab href="/" active={!showPeople}>
            최신 글
          </FeedTab>
          {user && (
            <FeedTab href="/?feed=following" active={Boolean(showPeople)}>
              팔로잉
            </FeedTab>
          )}
        </nav>
        {showPeople && peopleFeed ? (
          <>
            <nav className="flex gap-2 py-4">
              <PeopleTab href="/?feed=following" active={peopleFeed === "following"}>
                팔로잉
              </PeopleTab>
              <PeopleTab href="/?feed=followers" active={peopleFeed === "followers"}>
                팔로워
              </PeopleTab>
            </nav>
            <PeopleList
              people={people}
              empty={
                peopleFeed === "following"
                  ? "아직 팔로우한 사람이 없어요."
                  : "아직 팔로워가 없어요."
              }
            />
          </>
        ) : (
          <PostList posts={posts} empty={empty} />
        )}
      </section>
    </>
  );
}

function PeopleTab({
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
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {children}
    </Link>
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
