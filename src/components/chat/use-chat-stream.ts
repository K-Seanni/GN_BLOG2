"use client";

import { useRef, useState } from "react";

export type Message = { role: "user" | "model"; text: string };

export const MAX_LENGTH = 500;

// Sends the conversation to a streaming text endpoint and appends the answer as it arrives.
export function useChatStream(endpoint: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const abort = useRef<AbortController | null>(null);

  async function send(raw: string) {
    const text = raw.trim().slice(0, MAX_LENGTH);
    if (!text || pending) return false;

    const history: Message[] = [...messages, { role: "user", text }];
    setMessages([...history, { role: "model", text: "" }]);
    setPending(true);

    const controller = new AbortController();
    abort.current = controller;

    const write = (answer: string) => setMessages([...history, { role: "model", text: answer }]);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        write(
          (await response.text().catch(() => "")) || "지금은 답변을 만들 수 없어요. 잠시 후 다시 시도해 주세요.",
        );
        return true;
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
    return true;
  }

  function reset() {
    abort.current?.abort();
    setMessages([]);
    setPending(false);
  }

  return { messages, pending, send, reset };
}
