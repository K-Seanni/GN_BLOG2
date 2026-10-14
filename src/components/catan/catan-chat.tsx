"use client";

import { useEffect, useRef, useState } from "react";
import { RichText } from "@/components/chat/rich-text";
import { MAX_LENGTH, useChatStream } from "@/components/chat/use-chat-stream";

const SUGGESTIONS = [
  "도로를 지으려면 어떤 자원이 필요해요?",
  "7이 나오면 도둑은 어떻게 움직이나요?",
  "승리 조건은 무엇인가요?",
  "자원 거래는 어떻게 하나요?",
  "개발카드에는 어떤 종류가 있나요?",
];

export function CatanChat() {
  const { messages, pending, send, reset } = useChatStream("/api/catan");
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages]);

  function submit(raw: string) {
    if (!raw.trim() || pending) return;
    setInput("");
    void send(raw);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-[22rem] flex-col gap-4 rounded-2xl border border-black/10 bg-white/70 p-4 sm:p-6 dark:border-white/10 dark:bg-zinc-900/60" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <p className="text-zinc-700 dark:text-zinc-300">
              카탄 규칙이 궁금하면 편하게 물어보세요. 업로드된 규칙서에서 관련 부분을 찾아 답해 드려요.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => submit(question)}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-800"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 leading-7 ${
                message.role === "user"
                  ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {message.text ? <RichText text={message.text} /> : <span className="text-zinc-500">규칙서에서 찾는 중...</span>}
            </div>
          ))
        )}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit(input);
            }
          }}
          rows={1}
          maxLength={MAX_LENGTH}
          disabled={pending}
          placeholder="카탄 규칙을 물어보세요"
          aria-label="카탄 규칙 질문 입력"
          className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="h-12 shrink-0 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          전송
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              reset();
              setInput("");
            }}
            className="h-12 shrink-0 rounded-full px-4 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            새 대화
          </button>
        )}
      </form>
    </div>
  );
}
