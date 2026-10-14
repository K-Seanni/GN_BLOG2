"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("링크를 복사하세요", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 font-mono text-xs hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
    >
      {copied ? "복사됨 ✓" : "링크 복사"}
    </button>
  );
}
