"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { JSONContent } from "@tiptap/core";
import { effectiveDescription, SEO_LIMITS, seoChecklist, type CheckItem } from "@/lib/seo/analyze";
import { uploadImage } from "@/lib/editor/upload-image";
import { slugify } from "@/lib/slug";
import { TagInput } from "./tag-input";

export type SeoFields = {
  summary: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  slug: string;
  ogImageUrl: string;
  canonicalUrl: string;
  noindex: boolean;
};

type Props = {
  fields: SeoFields;
  onChange: (patch: Partial<SeoFields>) => void;
  title: string;
  coverImageUrl: string;
  doc: JSONContent;
  userId: string;
  username: string;
  siteHost: string;
  slugLocked: boolean;
  suggestedTags: string[];
};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100";

export function getSeoChecks(input: {
  title: string;
  fields: SeoFields;
  coverImageUrl: string;
  doc: JSONContent;
}) {
  return seoChecklist({
    title: input.title,
    seoTitle: input.fields.seoTitle,
    seoDescription: input.fields.seoDescription,
    summary: input.fields.summary,
    tags: input.fields.tags,
    hasImage: Boolean(input.fields.ogImageUrl || input.coverImageUrl),
    doc: input.doc,
  });
}

export function SeoPanel(props: Props) {
  const { fields, onChange, title, coverImageUrl, doc } = props;
  const checks = getSeoChecks({ title, fields, coverImageUrl, doc });
  const passed = checks.filter((c) => c.ok).length;

  const displayTitle = (fields.seoTitle || title || "제목 없음").trim();
  const description = effectiveDescription({ seoDescription: fields.seoDescription, summary: fields.summary, doc });
  const slug = fields.slug || slugify(title) || "post";
  const previewImage = fields.ogImageUrl || coverImageUrl;

  return (
    <details
      id="seo-panel"
      open
      className="group rounded-xl border border-black/10 bg-white/70 dark:border-white/10 dark:bg-zinc-900/60"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <span className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">SEO · GEO</span>
          <span className="font-semibold">검색 노출 설정</span>
        </span>
        <span className="flex items-center gap-3">
          <ScoreBadge passed={passed} total={checks.length} />
          <span aria-hidden className="text-zinc-400 transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      <div className="grid gap-8 border-t border-black/10 px-5 py-6 lg:grid-cols-[1fr_320px] dark:border-white/10">
        <div className="flex flex-col gap-6">
          <Field
            label="핵심 요약 (TL;DR)"
            hint="글 맨 위에 보여요. 이 글의 결론을 한두 문장으로 먼저 말해 주세요. AI 답변에 가장 많이 인용되는 부분이에요."
            count={fields.summary.length}
            max={SEO_LIMITS.summary}
          >
            <textarea
              value={fields.summary}
              onChange={(e) => onChange({ summary: e.target.value })}
              maxLength={SEO_LIMITS.summary}
              rows={3}
              placeholder="예: Next.js 16에서는 middleware 대신 proxy.ts를 써야 하고, 동작은 같아요."
              className={inputClass}
            />
          </Field>

          <Field label="태그" hint="최대 5개. 같은 주제의 글을 묶어 줘요.">
            <TagInput
              tags={fields.tags}
              onChange={(tags) => onChange({ tags })}
              suggestions={props.suggestedTags}
            />
          </Field>

          <Field
            label="검색 제목"
            hint="비워두면 글 제목을 써요."
            count={fields.seoTitle.length}
            max={SEO_LIMITS.seoTitle}
          >
            <input
              value={fields.seoTitle}
              onChange={(e) => onChange({ seoTitle: e.target.value })}
              maxLength={100}
              placeholder={title || "검색 결과에 보일 제목"}
              className={inputClass}
            />
          </Field>

          <Field
            label="검색 설명"
            hint="비워두면 요약이나 본문 첫 문단으로 자동 생성돼요."
            count={fields.seoDescription.length}
            max={SEO_LIMITS.description}
          >
            <textarea
              value={fields.seoDescription}
              onChange={(e) => onChange({ seoDescription: e.target.value })}
              maxLength={300}
              rows={2}
              placeholder={description || "검색 결과에 보일 설명"}
              className={inputClass}
            />
          </Field>

          <Field
            label="글 주소"
            hint={props.slugLocked ? "발행된 글은 링크가 깨지지 않도록 주소를 바꿀 수 없어요." : "비워두면 제목으로 만들어요."}
          >
            <div className="flex items-center rounded-lg border border-black/10 bg-white text-sm focus-within:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus-within:border-zinc-100">
              <span className="whitespace-nowrap pl-3 font-mono text-xs text-zinc-400">/@{props.username}/</span>
              <input
                value={fields.slug}
                disabled={props.slugLocked}
                onChange={(e) => onChange({ slug: e.target.value })}
                placeholder={slugify(title) || "post"}
                maxLength={80}
                className="h-10 flex-1 bg-transparent px-1 font-mono text-sm outline-none disabled:text-zinc-500"
              />
            </div>
          </Field>

          <AdvancedFields {...props} />
        </div>

        <div className="flex flex-col gap-6">
          <Preview label="Google 검색 결과">
            <div className="flex flex-col gap-1 rounded-lg bg-white p-4 dark:bg-zinc-950">
              <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                {props.siteHost} › @{props.username} › {slug}
              </span>
              <span className="line-clamp-1 text-lg text-[#1a0dab] dark:text-[#8ab4f8]">{displayTitle}</span>
              <span className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {description || "설명이 비어 있어요."}
              </span>
            </div>
          </Preview>

          <Preview label="카카오톡 · 소셜 공유">
            <div className="overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
              <div className="relative aspect-[1.91/1] bg-zinc-50 dark:bg-zinc-900">
                {previewImage ? (
                  <Image src={previewImage} alt="" fill className="object-cover" sizes="320px" />
                ) : (
                  <div className="flex h-full flex-col justify-between bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:16px_16px] p-4">
                    <span className="font-mono text-[10px] font-bold">■ gn/blog</span>
                    <span className="line-clamp-2 text-lg font-bold leading-tight">{title || "제목"}</span>
                    <span className="font-mono text-[10px] text-zinc-500">@{props.username}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-3">
                <span className="line-clamp-1 text-sm font-semibold">{displayTitle}</span>
                <span className="line-clamp-2 text-xs text-zinc-500">{description}</span>
                <span className="font-mono text-[10px] text-zinc-400">{props.siteHost}</span>
              </div>
            </div>
          </Preview>

          <Checklist checks={checks} />
        </div>
      </div>
    </details>
  );
}

function AdvancedFields({ fields, onChange, userId }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange({ ogImageUrl: await uploadImage(file, userId) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지를 올리지 못했어요.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <details className="rounded-lg border border-dashed border-black/15 px-4 py-3 dark:border-white/15">
      <summary className="cursor-pointer text-sm font-medium">고급 설정</summary>
      <div className="mt-4 flex flex-col gap-5">
        <Field label="공유 이미지 (OG)" hint="1200×630 권장. 비워두면 커버 이미지, 그것도 없으면 제목으로 자동 생성해요.">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="h-9 rounded-full border border-black/10 px-4 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-zinc-800"
            >
              {uploading ? "업로드 중..." : fields.ogImageUrl ? "이미지 바꾸기" : "이미지 올리기"}
            </button>
            {fields.ogImageUrl && (
              <button
                type="button"
                onClick={() => onChange({ ogImageUrl: "" })}
                className="text-sm text-zinc-500 hover:text-red-600"
              >
                삭제
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </Field>

        <Field label="원문 URL (canonical)" hint="다른 곳에 먼저 올린 글을 옮겨왔다면 원문 주소를 넣어 주세요. 중복 콘텐츠로 보지 않아요.">
          <input
            type="url"
            value={fields.canonicalUrl}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
            placeholder="https://"
            className={inputClass}
          />
        </Field>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={fields.noindex}
            onChange={(e) => onChange({ noindex: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-medium">검색엔진에서 숨기기</span>
            <span className="block text-xs text-zinc-500">
              글은 공개되지만 Google, 네이버, AI 검색 결과에는 나오지 않아요.
            </span>
          </span>
        </label>
      </div>
    </details>
  );
}

export function ScoreBadge({ passed, total }: { passed: number; total: number }) {
  const ratio = passed / total;
  const tone =
    ratio >= 0.8
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : ratio >= 0.5
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${tone}`}>
      {passed}/{total}
    </span>
  );
}

function Checklist({ checks }: { checks: CheckItem[] }) {
  return (
    <Preview label="체크리스트">
      <ul className="flex flex-col gap-2.5">
        {checks.map((check) => (
          <li key={check.id} className="flex gap-2 text-sm">
            <span
              aria-hidden
              className={`mt-0.5 font-mono text-xs ${check.ok ? "text-emerald-600" : "text-amber-600"}`}
            >
              {check.ok ? "✓" : "!"}
            </span>
            <span className="flex flex-col">
              <span className={check.ok ? "text-zinc-500 line-through decoration-zinc-300" : "font-medium"}>
                {check.label}
              </span>
              {!check.ok && <span className="text-xs text-zinc-500">{check.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Preview>
  );
}

function Field({
  label,
  hint,
  count,
  max,
  children,
}: {
  label: string;
  hint?: string;
  count?: number;
  max?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {max !== undefined && (
          <span className={`font-mono text-xs ${count! > max ? "text-amber-600" : "text-zinc-400"}`}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && <span className="text-xs leading-5 text-zinc-500">{hint}</span>}
    </div>
  );
}

function Preview({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-500">{label}</h3>
      {children}
    </section>
  );
}
