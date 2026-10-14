"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CommentFormState =
  | { nonce: number; error?: string; body?: string }
  | undefined;

export async function addComment(
  prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const nonce = (prev?.nonce ?? 0) + 1;
  const body = String(formData.get("body") ?? "").trim();
  const postId = String(formData.get("post_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "") || null;

  const user = await getCurrentUser();
  if (!user) return { nonce, body, error: "로그인 후 댓글을 남길 수 있어요." };
  if (!user.profile?.username) return { nonce, body, error: "아이디를 먼저 설정해 주세요." };
  if (!body) return { nonce, body, error: "내용을 입력해 주세요." };
  if (body.length > 2000) return { nonce, body, error: "댓글은 2000자 이내로 써 주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, parent_id: parentId, body });

  if (error) return { nonce, body, error: "댓글을 남기지 못했어요. 잠시 후 다시 시도해 주세요." };

  refresh();
  return { nonce };
}

export async function deleteComment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", String(formData.get("comment_id") ?? ""));

  refresh();
}
