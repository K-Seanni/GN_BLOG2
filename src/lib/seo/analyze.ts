import type { JSONContent } from "@tiptap/core";

export const SEO_LIMITS = {
  seoTitle: 60,
  descriptionMin: 50,
  description: 160,
  summary: 300,
  tags: 5,
  minChars: 300,
};

const CHARS_PER_MINUTE = 500;
const FILENAME_ALT = /\.(png|jpe?g|gif|webp)$/i;

function blockTexts(node: JSONContent, out: string[] = []) {
  if (node.type === "paragraph" || node.type === "heading") {
    const text = inlineText(node).trim();
    if (text) out.push(text);
    return out;
  }
  node.content?.forEach((child) => blockTexts(child, out));
  return out;
}

function inlineText(node: JSONContent): string {
  if (node.text) return node.text;
  return (node.content ?? []).map(inlineText).join("");
}

export function plainText(doc: JSONContent) {
  return blockTexts(doc).join("\n");
}

export function readingMinutes(text: string) {
  return Math.max(1, Math.round(text.replace(/\s/g, "").length / CHARS_PER_MINUTE));
}

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("다. "), cut.lastIndexOf("요. "));
  return (sentenceEnd > max * 0.6 ? cut.slice(0, sentenceEnd + 1) : cut.replace(/\s+\S*$/, "")) + "…";
}

/** First paragraph of the body, used when the author leaves the summary or description empty. */
export function leadParagraph(doc: JSONContent) {
  const first = (doc.content ?? []).find((node) => node.type === "paragraph" && inlineText(node).trim());
  return first ? inlineText(first).trim() : "";
}

export function contentStats(doc: JSONContent) {
  const stats = { h2: 0, h3: 0, images: 0, imagesMissingAlt: 0, links: 0 };
  const walk = (node: JSONContent) => {
    if (node.type === "heading") {
      if (node.attrs?.level === 2) stats.h2++;
      else stats.h3++;
    }
    if (node.type === "image") {
      stats.images++;
      const alt = String(node.attrs?.alt ?? "").trim();
      if (!alt || FILENAME_ALT.test(alt)) stats.imagesMissingAlt++;
    }
    if (node.marks?.some((mark) => mark.type === "link")) stats.links++;
    node.content?.forEach(walk);
  };
  walk(doc);
  return { ...stats, chars: plainText(doc).replace(/\s/g, "").length };
}

export type SeoInput = {
  title: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  tags: string[];
  hasImage: boolean;
  doc: JSONContent;
};

export type CheckItem = { id: string; label: string; ok: boolean; hint: string };

export function effectiveDescription(input: Pick<SeoInput, "seoDescription" | "summary" | "doc">) {
  return truncate(input.seoDescription || input.summary || leadParagraph(input.doc), SEO_LIMITS.description);
}

export function seoChecklist(input: SeoInput): CheckItem[] {
  const stats = contentStats(input.doc);
  const title = input.seoTitle || input.title;
  const description = effectiveDescription(input);

  return [
    {
      id: "title",
      label: "검색 제목 길이",
      ok: title.length >= 10 && title.length <= SEO_LIMITS.seoTitle,
      hint: `10-${SEO_LIMITS.seoTitle}자가 검색 결과에서 잘리지 않아요. 지금 ${title.length}자.`,
    },
    {
      id: "description",
      label: "검색 설명 길이",
      ok: description.length >= SEO_LIMITS.descriptionMin && description.length <= SEO_LIMITS.description,
      hint: `${SEO_LIMITS.descriptionMin}-${SEO_LIMITS.description}자를 권장해요. 지금 ${description.length}자.`,
    },
    {
      id: "summary",
      label: "핵심 요약(TL;DR)",
      ok: input.summary.trim().length >= 30,
      hint: "글 맨 위의 한두 문장 요약은 AI 답변에 인용되기 쉬워요.",
    },
    {
      id: "headings",
      label: "소제목(H2) 2개 이상",
      ok: stats.h2 >= 2,
      hint: "질문형 소제목으로 나누면 독자와 검색엔진이 구조를 이해하기 쉬워요.",
    },
    {
      id: "length",
      label: `본문 ${SEO_LIMITS.minChars}자 이상`,
      ok: stats.chars >= SEO_LIMITS.minChars,
      hint: `지금 ${stats.chars}자. 충분한 설명과 예시가 있는 글이 더 잘 노출돼요.`,
    },
    {
      id: "links",
      label: "출처나 참고 링크",
      ok: stats.links >= 1,
      hint: "수치나 주장에 출처 링크를 달면 신뢰도와 인용 가능성이 올라가요.",
    },
    {
      id: "alt",
      label: "이미지 대체 텍스트",
      ok: stats.imagesMissingAlt === 0,
      hint: stats.images
        ? `이미지 ${stats.imagesMissingAlt}개에 설명이 없어요. 이미지를 선택하고 '대체 텍스트'를 눌러주세요.`
        : "이미지가 없으면 통과예요.",
    },
    {
      id: "tags",
      label: "태그 1개 이상",
      ok: input.tags.length >= 1,
      hint: "태그는 같은 주제의 글끼리 묶어 내부 링크를 만들어 줘요.",
    },
    {
      id: "image",
      label: "대표 이미지",
      ok: input.hasImage,
      hint: "커버나 OG 이미지가 없으면 제목으로 자동 생성된 이미지를 써요.",
    },
  ];
}
