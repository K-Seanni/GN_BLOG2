import { MIN_SCORE, TOP_K } from "./config.ts";
import { embedTexts } from "./embed.ts";
import { getIndex, type ChunkMetadata } from "./pinecone.ts";

export type RetrievedChunk = ChunkMetadata & { score: number };

export async function retrieve(
  query: string,
  options: { topK?: number; minScore?: number } = {},
): Promise<RetrievedChunk[]> {
  const { topK = TOP_K, minScore = MIN_SCORE } = options;
  const [vector] = await embedTexts([query], "query");
  const index = await getIndex();
  const result = await index.query({ vector, topK, includeMetadata: true });

  return (result.matches ?? []).flatMap((match) => {
    const meta = match.metadata as Partial<ChunkMetadata> | undefined;
    if ((match.score ?? 0) < minScore || !meta?.text) return [];
    return [{ source: meta.source ?? "문서", page: meta.page ?? 0, text: meta.text, score: match.score ?? 0 }];
  });
}

export function formatContext(chunks: RetrievedChunk[]) {
  return chunks
    .map((chunk, i) => `[자료 ${i + 1}] (출처: ${chunk.source}${chunk.page ? ` ${chunk.page}쪽` : ""})\n${chunk.text}`)
    .join("\n\n");
}
