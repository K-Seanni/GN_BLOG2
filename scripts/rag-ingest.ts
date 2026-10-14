// Usage: npm run rag:ingest
// Reads every PDF in docs/rag, splits it into chunks, embeds them with Gemini and upserts them to Pinecone.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { chunkPages } from "../src/lib/rag/chunk.ts";
import { embedTexts } from "../src/lib/rag/embed.ts";
import { getIndexForIngest, type ChunkMetadata } from "../src/lib/rag/pinecone.ts";

const DOCS_DIR = path.resolve("docs/rag");
const UPSERT_BATCH = 100;

function slug(name: string) {
  return name.replace(/\.pdf$/i, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

async function readPages(file: string) {
  const buffer = await readFile(path.join(DOCS_DIR, file));
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });
  return text;
}

async function main() {
  const files = (await readdir(DOCS_DIR).catch(() => [])).filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (!files.length) {
    console.log(`No PDF files found. Put them in ${DOCS_DIR} and run again.`);
    return;
  }

  const index = await getIndexForIngest();
  let total = 0;

  for (const file of files) {
    const pages = await readPages(file);
    const chunks = chunkPages(pages);
    if (!chunks.length) {
      console.log(`- ${file}: no readable text (scanned PDF?). Skipped.`);
      continue;
    }

    const vectors = await embedTexts(chunks.map((c) => c.text), "document");
    const base = slug(file);
    const records = chunks.map((chunk, i) => ({
      id: `${base}-${i}`,
      values: vectors[i],
      metadata: { source: file, page: chunk.page, text: chunk.text } satisfies ChunkMetadata,
    }));

    // Re-ingesting the same file replaces its previous chunks.
    await index.deleteMany({ filter: { source: { $eq: file } } }).catch(() => undefined);
    for (let start = 0; start < records.length; start += UPSERT_BATCH) {
      await index.upsert({ records: records.slice(start, start + UPSERT_BATCH) });
    }

    total += records.length;
    console.log(`- ${file}: ${pages.length} pages, ${records.length} chunks`);
  }

  console.log(`Done. ${total} chunks stored.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
