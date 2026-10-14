import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { NextRequest } from "next/server";

// Falls through to the next model when the previous one is overloaded or unavailable.
const MODELS = [
  ...new Set([process.env.CHAT_MODEL || "gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.5-flash-lite"]),
];

const FIRST_CHUNK_TIMEOUT_MS = 15_000;
const MAX_MESSAGES = 10;
const MAX_TEXT_LENGTH = 500;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

export type ChatMessage = { role: "user" | "model"; text: string };

const hits = new Map<string, number[]>();

export function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function textResponse(message: string) {
  return new Response(message, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

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

// Checks the API key, the per-IP rate limit and the request body. `bucket` keeps each chat endpoint's limit separate.
export async function readChatRequest(
  request: NextRequest,
  bucket: string,
): Promise<{ messages: ChatMessage[] } | { error: Response }> {
  if (!process.env.GEMINI_API_KEY) {
    return { error: errorResponse("챗봇이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", 503) };
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`${bucket}:${ip}`)) {
    return { error: errorResponse("질문이 너무 빨라요. 잠시 후 다시 물어봐 주세요.", 429) };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: errorResponse("요청 형식이 올바르지 않아요.", 400) };
  }

  const messages = parseMessages(body);
  if (!messages) return { error: errorResponse("질문을 입력해 주세요.", 400) };
  return { messages };
}

// Streams Gemini's answer as plain text. The first chunk is awaited so an overloaded model falls through to the next one.
export async function streamAnswer(request: NextRequest, messages: ChatMessage[], systemInstruction: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const encoder = new TextEncoder();
  const contents = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));

  let opened: { iterator: AsyncIterator<{ text?: string }>; first: string } | null = null;
  for (const model of MODELS) {
    // A model that has not started answering in time is abandoned so the next one can try.
    const attempt = new AbortController();
    const onClientAbort = () => attempt.abort();
    request.signal.addEventListener("abort", onClientAbort);
    const timer = setTimeout(() => attempt.abort(), FIRST_CHUNK_TIMEOUT_MS);

    try {
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          maxOutputTokens: 2048,
          abortSignal: attempt.signal,
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
      attempt.abort();
      if (request.signal.aborted) break;
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", onClientAbort);
    }
  }
  if (!opened) {
    return errorResponse("지금은 답변을 만들 수 없어요. 잠시 후 다시 시도해 주세요.", 502);
  }

  const { iterator, first } = opened;
  const body = new ReadableStream({
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

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
