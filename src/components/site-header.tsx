import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/avatar";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) return <GoogleSignInButton compact />;

  const username = user.profile?.username;
  const name = user.profile?.full_name ?? username ?? "회원";

  return (
    <div className="flex items-center gap-4">
      {username ? (
        <>
          <Link
            href="/write"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            글쓰기
          </Link>
          <Link href={`/@${username}`} aria-label="내 블로그">
            <Avatar src={user.profile?.avatar_url} name={name} />
          </Link>
          <Link
            href="/settings/profile"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            설정
          </Link>
        </>
      ) : (
        <Link href="/onboarding" className="text-sm font-medium underline underline-offset-4">
          아이디 설정하기
        </Link>
      )}
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <nav aria-label="주요 메뉴" className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="GN Blog 홈"
            className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight"
          >
            <span aria-hidden className="h-2.5 w-2.5 bg-foreground" />
            gn/blog
          </Link>
          <Link
            href="/tags"
            className="font-mono text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            tags
          </Link>
          <Link
            href="/catan"
            className="font-mono text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            catan
          </Link>
        </nav>
        <Suspense fallback={<div className="h-9" />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
