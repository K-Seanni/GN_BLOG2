"use client";

import { useActionState } from "react";
import { addComment, type CommentFormState } from "@/app/actions/comments";

type Props = {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
};

export function CommentForm({ postId, parentId, placeholder, onSuccess }: Props) {
  const [state, action, pending] = useActionState(
    async (prev: CommentFormState, formData: FormData) => {
      const result = await addComment(prev, formData);
      if (!result?.error) onSuccess?.();
      return result;
    },
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        key={state?.nonce ?? 0}
        name="body"
        required
        maxLength={2000}
        rows={parentId ? 2 : 3}
        defaultValue={state?.body ?? ""}
        placeholder={placeholder ?? "댓글을 남겨주세요"}
        className="w-full rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100"
      />
      <div className="flex items-center justify-between gap-4">
        <p role="alert" className="text-sm text-red-600">
          {state?.error}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="h-9 shrink-0 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {pending ? "등록 중..." : parentId ? "답글 등록" : "댓글 등록"}
        </button>
      </div>
    </form>
  );
}
