"use client";

import { Fragment, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "model"; text: string };

const SUGGESTIONS = ["글은 어떻게 쓰나요?", "팔로우는 어디서 하나요?", "로그인이 안 돼요"];
const MAX_LENGTH = 500;

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(raw: string) {
    const text = raw.trim().slice(0, MAX_LENGTH);
    if (!text || pending) return;

    const history: Message[] = [...messages, { role: "user", text }];
    setMessages([...history, { role: "model", text: "" }]);
    setInput("");
    setPending(true);

    const controller = new AbortController();
    abort.current = controller;

    const write = (answer: string) =>
      setMessages([...history, { role: "model", text: answer }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        write(
          (await response.text().catch(() => "")) || "지금은 답변을 만들 수 없어요. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        write(answer);
      }
      if (!answer.trim()) write("답변을 받지 못했어요. 다시 질문해 주세요.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        write("네트워크 문제로 답변을 받지 못했어요. 다시 시도해 주세요.");
      }
    } finally {
      setPending(false);
      abort.current = null;
    }
  }

  function reset() {
    abort.current?.abort();
    setMessages([]);
    setInput("");
    setPending(false);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="GN Blog 이용 안내 챗봇"
          className="flex h-[min(34rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/15 dark:bg-zinc-950"
        >
          <header className="flex items-center gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
            <span aria-hidden className="h-3 w-3 bg-zinc-900 dark:bg-zinc-100" />
            <h2 className="font-mono text-sm font-bold">gn/help</h2>
            <span className="text-xs text-zinc-500">블로그 이용 안내</span>
            <div className="ml-auto flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  새 대화
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="챗봇 닫기"
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={scroller} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  안녕하세요! GN Blog 이용 방법이 궁금하면 편하게 물어보세요.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => send(question)}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-white/15 dark:hover:bg-zinc-900"
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
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {message.text ? <RichText text={message.text} /> : <span className="text-zinc-500">답변 중...</span>}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              maxLength={MAX_LENGTH}
              disabled={pending}
              placeholder="이용 방법을 물어보세요"
              aria-label="질문 입력"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-white/15 dark:focus:border-zinc-100"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="h-10 shrink-0 rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              전송
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "챗봇 닫기" : "이용 안내 챗봇 열기"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.4A8 8 0 1 1 21 12z" />
          )}
        </svg>
      </button>
    </div>
  );
}
