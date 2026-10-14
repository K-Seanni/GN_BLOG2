"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import { deletePost, savePost } from "@/app/actions/posts";
import { PostEditor } from "@/components/editor/post-editor";
import { getSeoChecks, ScoreBadge, SeoPanel, type SeoFields } from "@/components/editor/seo-panel";
import { EMPTY_DOC } from "@/lib/editor/extensions";
import { uploadImage } from "@/lib/editor/upload-image";

type Props = {
  userId: string;
  username: string;
  siteHost: string;
  suggestedTags: string[];
  post?: {
    id: string;
    title: string;
    slug: string;
    content: JSONContent;
    cover_image_url: string | null;
    status: string;
    published_at: string | null;
    summary: string | null;
    seo_title: string | null;
    seo_description: string | null;
    tags: string[];
    og_image_url: string | null;
    canonical_url: string | null;
    noindex: boolean;
  };
};

export function PostForm({ userId, username, siteHost, suggestedTags, post }: Props) {
  const [state, action, pending] = useActionState(savePost, undefined);
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState<JSONContent>(post?.content ?? EMPTY_DOC);
  const [cover, setCover] = useState(post?.cover_image_url ?? "");
  const [seo, setSeo] = useState<SeoFields>({
    summary: post?.summary ?? "",
    seoTitle: post?.seo_title ?? "",
    seoDescription: post?.seo_description ?? "",
    tags: post?.tags ?? [],
    slug: post?.slug ?? "",
    ogImageUrl: post?.og_image_url ?? "",
    canonicalUrl: post?.canonical_url ?? "",
    noindex: post?.noindex ?? false,
  });
  const checks = getSeoChecks({ title, fields: seo, coverImageUrl: cover, doc: content });
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);

  async function handleCover(file: File | undefined) {
    if (!file) return;
    setCoverError(null);
    setCoverUploading(true);
    try {
      setCover(await uploadImage(file, userId));
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
    } finally {
      setCoverUploading(false);
    }
  }

  const isPublished = post?.status === "published";

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-6">
        <input type="hidden" name="post_id" value={post?.id ?? ""} />
        <input type="hidden" name="content" value={JSON.stringify(content)} />
        <input type="hidden" name="cover_image_url" value={cover} />
        <input type="hidden" name="summary" value={seo.summary} />
        <input type="hidden" name="seo_title" value={seo.seoTitle} />
        <input type="hidden" name="seo_description" value={seo.seoDescription} />
        <input type="hidden" name="tags" value={JSON.stringify(seo.tags)} />
        <input type="hidden" name="slug" value={seo.slug} />
        <input type="hidden" name="og_image_url" value={seo.ogImageUrl} />
        <input type="hidden" name="canonical_url" value={seo.canonicalUrl} />
        {seo.noindex && <input type="hidden" name="noindex" value="on" />}

        <div className="sticky top-0 z-20 -mx-6 flex items-center justify-between gap-4 border-b border-black/5 bg-zinc-50/90 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-black/90">
          <span className="text-sm text-zinc-500">
            {post ? (isPublished ? "발행된 글 수정" : "임시저장된 글") : "새 글"}
          </span>
          <div className="flex items-center gap-2">
            <a
              href="#seo-panel"
              className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              SEO <ScoreBadge passed={checks.filter((c) => c.ok).length} total={checks.length} />
            </a>
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={pending}
              className="h-10 rounded-full border border-black/10 px-4 text-sm font-medium hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-zinc-900"
            >
              {isPublished ? "비공개로 전환" : "임시저장"}
            </button>
            <button
              type="submit"
              name="intent"
              value="publish"
              disabled={pending}
              className="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-background hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
            >
              {pending ? "저장 중..." : isPublished ? "수정 완료" : "발행하기"}
            </button>
          </div>
        </div>

        {(state?.error || state?.message) && (
          <p
            role={state.error ? "alert" : "status"}
            className={`text-sm ${state.error ? "text-red-600" : "text-emerald-600"}`}
          >
            {state.error ?? state.message}
          </p>
        )}

        {cover ? (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <Image src={cover} alt="" fill className="object-cover" sizes="768px" />
            <button
              type="button"
              onClick={() => setCover("")}
              className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
            >
              커버 삭제
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={coverUploading}
            className="self-start text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {coverUploading ? "커버 이미지 업로드 중..." : "+ 커버 이미지 추가"}
          </button>
        )}
        {coverError && <p role="alert" className="text-sm text-red-600">{coverError}</p>}
        <input
          ref={coverInput}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          hidden
          onChange={(event) => {
            void handleCover(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="제목"
          maxLength={200}
          required
          className="bg-transparent text-4xl font-semibold tracking-tight outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
        />

        <PostEditor userId={userId} initialContent={content} onChange={setContent} />

        <SeoPanel
          fields={seo}
          onChange={(patch) => setSeo((current) => ({ ...current, ...patch }))}
          title={title}
          coverImageUrl={cover}
          doc={content}
          userId={userId}
          username={username}
          siteHost={siteHost}
          slugLocked={Boolean(post?.published_at)}
          suggestedTags={suggestedTags}
        />
      </form>

      {post && (
        <form
          action={deletePost}
          onSubmit={(event) => {
            if (!window.confirm("이 글을 삭제할까요? 되돌릴 수 없어요.")) event.preventDefault();
          }}
          className="border-t border-black/10 pt-6 dark:border-white/10"
        >
          <input type="hidden" name="post_id" value={post.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            글 삭제
          </button>
        </form>
      )}
    </div>
  );
}
