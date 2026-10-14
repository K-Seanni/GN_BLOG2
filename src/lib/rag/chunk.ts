import { CHUNK_OVERLAP, CHUNK_SIZE } from "./config.ts";

export type Chunk = { text: string; page: number };

function clean(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLong(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const boundary = Math.max(
        text.lastIndexOf(". ", end),
        text.lastIndexOf("다. ", end),
        text.lastIndexOf("\n", end),
      );
      if (boundary > start + CHUNK_SIZE / 2) end = boundary + 1;
    }
    pieces.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }
  return pieces.filter(Boolean);
}

// Packs paragraphs of one page into chunks of roughly CHUNK_SIZE characters.
export function chunkPages(pages: string[]): Chunk[] {
  const chunks: Chunk[] = [];

  pages.forEach((raw, index) => {
    const page = index + 1;
    const paragraphs = clean(raw)
      .split(/\n{2,}/)
      .map((p) => p.replace(/\n/g, " ").trim())
      .filter(Boolean);

    let buffer = "";
    const flush = () => {
      if (buffer.trim()) chunks.push({ text: buffer.trim(), page });
      buffer = "";
    };

    for (const paragraph of paragraphs) {
      for (const piece of splitLong(paragraph)) {
        if (buffer && buffer.length + piece.length + 1 > CHUNK_SIZE) flush();
        buffer = buffer ? `${buffer}\n${piece}` : piece;
      }
    }
    flush();
  });

  return chunks.filter((c) => c.text.length >= 30);
}
