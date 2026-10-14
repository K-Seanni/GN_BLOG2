"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/actions/profile";

type Props = {
  defaultFullName: string;
  defaultBio: string;
};

export function ProfileForm({ defaultFullName, defaultBio }: Props) {
  const [state, action, pending] = useActionState(saveProfile, undefined);

  return (
    <form action={action} className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">아이디</span>
        <div className="flex items-center rounded-lg border border-black/10 bg-white px-3 focus-within:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus-within:border-zinc-100">
          <span className="text-zinc-400">@</span>
          <input
            name="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            autoComplete="off"
            placeholder="my_blog"
            className="h-11 flex-1 bg-transparent px-1 outline-none"
          />
        </div>
        <span className="text-xs text-zinc-500">
          영문 소문자, 숫자, _ 3-20자. 블로그 주소가 돼요.
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">이름</span>
        <input
          name="full_name"
          defaultValue={defaultFullName}
          maxLength={50}
          className="h-11 rounded-lg border border-black/10 bg-white px-3 outline-none focus:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">소개</span>
        <textarea
          name="bio"
          defaultValue={defaultBio}
          maxLength={160}
          rows={3}
          placeholder="어떤 글을 쓰는 사람인지 한 줄로 알려주세요."
          className="rounded-lg border border-black/10 bg-white p-3 outline-none focus:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
      </label>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-foreground font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "저장 중..." : "시작하기"}
      </button>
    </form>
  );
}
