"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";

type Props = {
  username: string;
  fullName: string;
  bio: string;
  websiteUrl: string;
  socialLinks: string[];
};

const inputClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2.5 outline-none focus:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function SettingsForm({ username, fullName, bio, websiteUrl, socialLinks }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">아이디</span>
        <input value={`@${username}`} disabled className={`${inputClass} font-mono text-zinc-500`} />
        <span className="text-xs text-zinc-500">블로그 주소가 바뀌면 기존 링크가 깨져서 아이디는 바꿀 수 없어요.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">이름</span>
        <input name="full_name" defaultValue={fullName} maxLength={50} className={inputClass} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">소개</span>
        <textarea
          name="bio"
          defaultValue={bio}
          maxLength={160}
          rows={3}
          placeholder="어떤 글을 쓰는 사람인지 알려주세요. 글 하단 작성자 소개와 검색 결과에 쓰여요."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">웹사이트</span>
        <input
          name="website_url"
          type="url"
          defaultValue={websiteUrl}
          placeholder="https://"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">소셜 링크</span>
        <textarea
          name="social_links"
          defaultValue={socialLinks.join("\n")}
          rows={4}
          placeholder={"https://github.com/아이디\nhttps://www.linkedin.com/in/아이디"}
          className={`${inputClass} font-mono text-sm`}
        />
        <span className="text-xs leading-5 text-zinc-500">
          한 줄에 하나씩, 최대 5개. 검색엔진과 AI가 &quot;같은 사람&quot;임을 확인하는 근거(sameAs)로 쓰여 글의 신뢰도를 높여요.
        </span>
      </label>

      {(state?.error || state?.message) && (
        <p
          role={state.error ? "alert" : "status"}
          className={`text-sm ${state.error ? "text-red-600" : "text-emerald-600"}`}
        >
          {state.error ?? state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 self-start rounded-full bg-foreground px-6 font-medium text-background hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
