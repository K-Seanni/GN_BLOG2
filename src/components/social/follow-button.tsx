"use client";

import { useOptimistic, useTransition } from "react";
import { setFollow } from "@/app/actions/social";

type Props = {
  targetId: string;
  following: boolean;
  canFollow: boolean;
};

export function FollowButton({ targetId, following, canFollow }: Props) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(following);

  function toggle() {
    if (!canFollow) {
      window.alert("로그인 후 팔로우할 수 있어요.");
      return;
    }
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await setFollow(targetId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      className={`h-9 rounded-full px-5 text-sm font-medium transition-colors ${
        optimistic
          ? "border border-black/10 hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
          : "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
      }`}
    >
      {optimistic ? "팔로잉" : "팔로우"}
    </button>
  );
}
