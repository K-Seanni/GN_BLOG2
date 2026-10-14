"use client";

import { useState } from "react";
import { CommentForm } from "./comment-form";

export function ReplyToggle({ postId, parentId }: { postId: string; parentId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="self-start text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {open ? "답글 취소" : "답글 달기"}
      </button>
      {open && (
        <CommentForm
          postId={postId}
          parentId={parentId}
          placeholder="답글을 남겨주세요"
          onSuccess={() => setOpen(false)}
        />
      )}
    </div>
  );
}
