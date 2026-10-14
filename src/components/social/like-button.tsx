"use client";

import { useOptimistic, useTransition } from "react";
import { setLike } from "@/app/actions/social";

type Props = {
  postId: string;
  liked: boolean;
  count: number;
  canLike: boolean;
};

export function LikeButton({ postId, liked, count, canLike }: Props) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(
    { liked, count },
    (current, next: boolean) => ({
      liked: next,
      count: current.count + (next ? 1 : -1),
    }),
  );

  function toggle() {
    if (!canLike) {
      window.alert("로그인 후 좋아요를 누를 수 있어요.");
      return;
    }
    const next = !state.liked;
    startTransition(async () => {
      setOptimistic(next);
      await setLike(postId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={state.liked}
      className={`flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
        state.liked
          ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400"
          : "border-black/10 hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
      }`}
    >
      <span aria-hidden>{state.liked ? "♥" : "♡"}</span>
      좋아요 {state.count}
    </button>
  );
}
