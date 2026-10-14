import type { NextRequest } from "next/server";
import { readChatRequest, streamAnswer, errorResponse } from "@/lib/chat/server";
import { buildCatanInstruction } from "@/lib/catan/prompt";
import { formatContext, retrieve } from "@/lib/rag/retrieve";

const RETRIEVE_TIMEOUT_MS = 8000;
const TOP_K = 6;

export async function POST(request: NextRequest) {
  const parsed = await readChatRequest(request, "catan");
  if ("error" in parsed) return parsed.error;
  if (!process.env.PINECONE_API_KEY) {
    return errorResponse("규칙 자료가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.", 503);
  }

  const { messages } = parsed;
  // Short follow-ups like "그럼 도시는요?" only make sense with the previous question, so search with both.
  const query = messages
    .filter((m) => m.role === "user")
    .slice(-2)
    .map((m) => m.text)
    .join("\n");

  let context: string | undefined;
  try {
    const chunks = await Promise.race([
      retrieve(query, { topK: TOP_K }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("retrieval timeout")), RETRIEVE_TIMEOUT_MS)),
    ]);
    context = chunks.length ? formatContext(chunks) : undefined;
  } catch (error) {
    console.error("[catan] retrieval failed", error instanceof Error ? error.message : error);
    return errorResponse("규칙 자료를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", 502);
  }

  return streamAnswer(request, messages, buildCatanInstruction(context));
}
