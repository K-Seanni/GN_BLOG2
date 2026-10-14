import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

async function Onboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.profile?.username) redirect(`/@${user.profile.username}`);

  return (
    <ProfileForm
      defaultFullName={user.profile?.full_name ?? ""}
      defaultBio={user.profile?.bio ?? ""}
    />
  );
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">블로그 주소 정하기</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          아이디는 블로그 주소로 쓰여요. 예: /@my_blog
        </p>
      </div>
      <Suspense fallback={<div className="h-96" />}>
        <Onboarding />
      </Suspense>
    </main>
  );
}
