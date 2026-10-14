"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cacheTags } from "@/lib/data/cache-tags";
import { parseContent } from "@/lib/editor/content";
import { postPath } from "@/lib/posts";
import { leadParagraph, plainText, readingMinutes, SEO_LIMITS, truncate } from "@/lib/seo/analyze";
import { normalizeTag, slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type PostFormState = { error?: string; message?: string } | undefined;

const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-images/`;

function storageUrl(value: FormDataEntryValue | null) {
  const url = String(value ?? "");
  return url.startsWith(STORAGE_PREFIX) ? url : null;
}

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max) || null;
}

function parseTags(raw: FormDataEntryValue | null) {
  let values: unknown = [];
  try {
    values = JSON.parse(String(raw ?? "[]"));
  } catch {}
  if (!Array.isArray(values)) return [];
  const tags = values.map((v) => normalizeTag(String(v))).filter(Boolean);
  return [...new Set(tags)].slice(0, SEO_LIMITS.tags);
}

function parseCanonical(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && value.length <= 500 ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorId: string,
  source: string,
  excludeId?: string,
) {
  const base = slugify(source) || "post";
  let query = supabase.from("posts").select("slug").eq("author_id", authorId).like("slug", `${base}%`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;

  const taken = new Set((data ?? []).map((row) => row.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function invalidate(username: string, ...slugs: string[]) {
  updateTag(cacheTags.posts);
  for (const slug of new Set(slugs)) updateTag(cacheTags.post(username, slug));
}

export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const user = await requireUser();

  const postId = String(formData.get("post_id") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const status = formData.get("intent") === "publish" ? "published" : "draft";
  const coverImageUrl = storageUrl(formData.get("cover_image_url"));
  const canonicalUrl = parseCanonical(formData.get("canonical_url"));
  const requestedSlug = slugify(String(formData.get("slug") ?? ""));

  if (!title) return { error: "제목을 입력해 주세요." };
  if (title.length > 200) return { error: "제목은 200자 이내로 써 주세요." };
  if (canonicalUrl === undefined) return { error: "원문 URL은 http(s)로 시작하는 주소여야 해요." };

  let content;
  try {
    content = parseContent(JSON.parse(String(formData.get("content") ?? "")));
  } catch {
    return { error: "본문을 읽지 못했어요. 새로고침 후 다시 시도해 주세요." };
  }

  const bodyText = plainText(content.json);
  if (status === "published" && !bodyText.trim() && !coverImageUrl) {
    return { error: "본문을 작성한 뒤 발행해 주세요." };
  }

  const fields = {
    title,
    content: content.json,
    excerpt: truncate(leadParagraph(content.json) || bodyText, SEO_LIMITS.description) || null,
    summary: text(formData, "summary", SEO_LIMITS.summary),
    seo_title: text(formData, "seo_title", 100),
    seo_description: text(formData, "seo_description", 300),
    tags: parseTags(formData.get("tags")),
    reading_minutes: readingMinutes(bodyText),
    cover_image_url: coverImageUrl,
    og_image_url: storageUrl(formData.get("og_image_url")),
    canonical_url: canonicalUrl,
    noindex: formData.get("noindex") === "on",
    status,
  };

  const supabase = await createClient();

  if (!postId) {
    const slug = await uniqueSlug(supabase, user.id, requestedSlug || title);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        ...fields,
        author_id: user.id,
        slug,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("id, slug")
      .single();

    if (error || !data) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

    invalidate(user.username, data.slug);
    redirect(status === "published" ? postPath(user.username, data.slug) : `/edit/${data.id}`);
  }

  const { data: existing } = await supabase
    .from("posts")
    .select("slug, published_at")
    .eq("id", postId)
    .eq("author_id", user.id)
    .single();

  if (!existing) return { error: "글을 찾을 수 없어요." };

  // Once a post has been published its URL is public, so the slug stays fixed.
  const slug =
    !existing.published_at && requestedSlug && requestedSlug !== existing.slug
      ? await uniqueSlug(supabase, user.id, requestedSlug, postId)
      : existing.slug;

  const { error } = await supabase
    .from("posts")
    .update({
      ...fields,
      slug,
      published_at:
        status === "published"
          ? (existing.published_at ?? new Date().toISOString())
          : existing.published_at,
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  invalidate(user.username, existing.slug, slug);

  if (status === "published") redirect(postPath(user.username, slug));
  return { message: "임시저장했어요." };
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("post_id") ?? "");

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id)
    .select("slug")
    .maybeSingle();

  if (data) invalidate(user.username, data.slug);
  redirect(`/@${user.username}`);
}
