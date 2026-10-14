import { Suspense } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

async function AuthSection() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (!userId) {
    return (
      <div className="flex flex-col items-center gap-3">
        <GoogleSignInButton />
        <p className="text-sm text-zinc-500">
          처음이시면 Google 계정으로 바로 가입돼요.
        </p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .single();

  const name = profile?.full_name ?? data.claims.email ?? "회원";

  return (
    <div className="flex flex-col items-center gap-4">
      {profile?.avatar_url && (
        <Image
          src={profile.avatar_url}
          alt=""
          width={64}
          height={64}
          className="rounded-full"
        />
      )}
      <p className="text-lg">
        <span className="font-semibold">{name}</span> 님, 환영해요
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">GN Blog</span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 pb-24 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            생각을 기록하고, 함께 나누는 공간
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Google 계정 하나로 3초 만에 가입하고 바로 글을 쓰세요.
          </p>
        </div>

        <Suspense fallback={<div className="h-12" />}>
          <AuthSection />
        </Suspense>
      </main>
    </div>
  );
}
