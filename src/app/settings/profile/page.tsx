import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

async function ProfileSettings() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, website_url, social_links")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Link href={`/@${user.username}`} className="font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← @{user.username}
      </Link>
      <SettingsForm
        username={user.username}
        fullName={profile?.full_name ?? ""}
        bio={profile?.bio ?? ""}
        websiteUrl={profile?.website_url ?? ""}
        socialLinks={profile?.social_links ?? []}
      />
    </>
  );
}

export default function ProfileSettingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">settings</p>
        <h1 className="text-2xl font-semibold tracking-tight">프로필 설정</h1>
      </div>
      <Suspense fallback={<div className="h-96" />}>
        <ProfileSettings />
      </Suspense>
    </main>
  );
}
