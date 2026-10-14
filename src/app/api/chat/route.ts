import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";
import { SYSTEM_INSTRUCTION } from "@/lib/chat/knowledge";

// Falls through to the next model when the previous one is overloaded or unavailable.
const MODELS = [
  ...new Set([process.env.CHAT_MODEL || "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"]),
];
const MAX_MESSAGES = 10;
const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

const hits = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT;
}

type ChatMessage = { role: "user" | "model"; text: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) {
    return null;
  }

  const messages: ChatMessage[] = [];
  for (const item of (body as { messages: unknown[] }).messages.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") return null;
    const { role, text } = item as { role?: unknown; text?: unknown };
    if ((role !== "user" && role !== "model") || typeof text !== "string") return null;
    const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
    if (trimmed) messages.push({ role, text: trimmed });
  }

  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return errorResponse("챗봇이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", 503);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return errorResponse("질문이 너무 빨라요. 잠시 후 다시 물어봐 주세요.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("요청 형식이 올바르지 않아요.", 400);
  }

  const messages = parseMessages(body);
  if (!messages) return errorResponse("질문을 입력해 주세요.", 400);

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const contents = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  // Opens a stream and waits for its first text chunk, so overloaded models fall through to the next one.
  let opened: { iterator: AsyncIterator<{ text?: string }>; first: string } | null = null;
  for (const model of MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3,
          maxOutputTokens: 2048,
          abortSignal: request.signal,
          httpOptions: { retryOptions: { attempts: 1 } },
        },
      });
      const iterator = stream[Symbol.asyncIterator]();
      let first = "";
      while (!first) {
        const { value, done } = await iterator.next();
        if (done) throw new Error("empty response");
        first = value.text ?? "";
      }
      opened = { iterator, first };
      break;
    } catch (error) {
      console.error(`[chat] ${model} failed`, error instanceof Error ? error.message : error);
    }
  }
  if (!opened) {
    return errorResponse("지금은 답변을 만들 수 없어요. 잠시 후 다시 시도해 주세요.", 502);
  }

  const { iterator, first } = opened;
  const body$ = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(first));
      try {
        for (;;) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (value.text) controller.enqueue(encoder.encode(value.text));
        }
      } catch (error) {
        console.error("[chat] stream interrupted", error instanceof Error ? error.message : error);
        controller.enqueue(encoder.encode("\n\n(답변이 중간에 끊겼어요. 같은 질문을 다시 보내 주세요.)"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
