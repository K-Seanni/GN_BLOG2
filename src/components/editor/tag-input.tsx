"use client";

import { useState } from "react";
import { SEO_LIMITS } from "@/lib/seo/analyze";
import { normalizeTag } from "@/lib/slug";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
};

export function TagInput({ tags, onChange, suggestions }: Props) {
  const [draft, setDraft] = useState("");
  const full = tags.length >= SEO_LIMITS.tags;
  const query = normalizeTag(draft);
  const matches = suggestions
    .filter((tag) => !tags.includes(tag) && (!query || tag.includes(query)))
    .slice(0, 8);

  function add(value: string) {
    const tag = normalizeTag(value);
    if (!tag || tags.includes(tag) || full) return;
    onChange([...tags, tag]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white px-2 py-1.5 focus-within:border-zinc-900 dark:border-white/15 dark:bg-zinc-900 dark:focus-within:border-zinc-100">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-800"
          >
            #{tag}
            <button
              type="button"
              aria-label={`${tag} 태그 삭제`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          disabled={full}
          onChange={(event) => {
            const value = event.target.value;
            if (/[,\n]$/.test(value)) add(value.slice(0, -1));
            else setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={full ? "태그는 5개까지예요" : "태그 입력 후 Enter (예: nextjs)"}
          className="h-8 min-w-40 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>
      {!full && matches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-500">추천</span>
          {matches.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="rounded-md border border-dashed border-black/15 px-2 py-0.5 font-mono text-xs text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-white/20 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
