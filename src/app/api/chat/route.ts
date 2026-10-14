import type { NextRequest } from "next/server";
import { SYSTEM_INSTRUCTION } from "@/lib/chat/knowledge";
import { readChatRequest, streamAnswer } from "@/lib/chat/server";

export async function POST(request: NextRequest) {
  const parsed = await readChatRequest(request, "guide");
  if ("error" in parsed) return parsed.error;

  return streamAnswer(request, parsed.messages, SYSTEM_INSTRUCTION);
}
