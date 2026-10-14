import type { Metadata } from "next";
import { CatanChat } from "@/components/catan/catan-chat";

export const metadata: Metadata = {
  title: "카탄 규칙 질문",
  description: "카탄 규칙서를 검색해 궁금한 규칙에 바로 답해 드려요. 자원, 건설, 도둑, 거래, 승리 조건까지 물어보세요.",
  alternates: { canonical: "/catan" },
};

export default function CatanPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-8 flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">gn/catan</span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">카탄 규칙 질문</h1>
        <p className="leading-7 text-zinc-600 dark:text-zinc-400">
          규칙서에서 관련 부분을 찾아 답하고, 답변 끝에 출처 쪽수를 알려 드려요.
        </p>
      </header>
      <CatanChat />
    </main>
  );
}
