import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from "./config.ts";

export type EmbedKind = "document" | "query";

const BATCH_SIZE = 50;

let client: GoogleGenAI | null = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// gemini-embedding-2 has no taskType option; the task goes into the text itself.
function prepare(text: string, kind: EmbedKind) {
  if (!EMBEDDING_MODEL.includes("embedding-2")) return text;
  return kind === "query"
    ? `task: search result | query: ${text}`
    : `title: none | text: ${text}`;
}

export async function embedTexts(texts: string[], kind: EmbedKind): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE).map((t) => prepare(t, kind));
    const response = await getClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: batch,
      config: {
        outputDimensionality: EMBEDDING_DIMENSION,
        ...(EMBEDDING_MODEL.includes("embedding-2")
          ? {}
          : { taskType: kind === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT" }),
      },
    });

    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== batch.length) {
      throw new Error(`Expected ${batch.length} embeddings, received ${embeddings.length}`);
    }
    for (const item of embeddings) vectors.push(item.values ?? []);
  }

  return vectors;
}
