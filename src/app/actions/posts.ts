"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseContent } from "@/lib/editor/content";
import { postPath } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string; message?: string } | undefined;

const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/`;

function slugify(title: string) {
  const slug = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
  return slug || "post";
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  title: string,
) {
  const base = slugify(title);
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("author_id", authorId)
    .like("slug", `${base}%`);

  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();

  const postId = String(formData.get("post_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const status = formData.get("intent") === "publish" ? "published" : "draft";
  const coverRaw = String(formData.get("cover_image_url") ?? "");
  const coverImageUrl = coverRaw.startsWith(STORAGE_PREFIX) ? coverRaw : null;

  if (!title) return { error: "제목을 입력해 주세요." };
  if (title.length > 200) return { error: "제목은 200자 이내로 써 주세요." };

  let content;
  try {
    content = parseContent(JSON.parse(String(formData.get("content") ?? "")));
  } catch {
    return { error: "본문을 읽지 못했어요. 새로고침 후 다시 시도해 주세요." };
  }

  if (status === "published" && !content.text.trim() && !coverImageUrl) {
    return { error: "본문을 작성한 뒤 발행해 주세요." };
  }

  const excerpt = content.text.replace(/\s+/g, " ").trim().slice(0, 160) || null;
  const supabase = await createClient();

  if (!postId) {
    const slug = await uniqueSlug(supabase, user.id, title);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        title,
        slug,
        content: content.json,
        excerpt,
        cover_image_url: coverImageUrl,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single();

    if (error || !data) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

    redirect(status === "published" ? postPath(user.username, data.slug) : `/edit/${data.id}`);
  }

  const { data: existing } = await supabase
    .from("posts")
    .select("slug, published_at")
    .eq("id", postId)
    .eq("author_id", user.id)
    .single();

  if (!existing) return { error: "글을 찾을 수 없어요." };

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      content: content.json,
      excerpt,
      cover_image_url: coverImageUrl,
      status,
      published_at:
        status === "published"
          ? (existing.published_at ?? new Date().toISOString())
          : existing.published_at,
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  if (status === "published") redirect(postPath(user.username, existing.slug));
  return { message: "임시저장했어요." };
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("post_id") ?? "");

  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId).eq("author_id", user.id);

  redirect(`/@${user.username}`);
}
