// Usage: npm run rag:query -- "질문"
// Prints the chunks the chatbot would receive for a question.
import { retrieve } from "../src/lib/rag/retrieve.ts";

const question = process.argv.slice(2).join(" ").trim();
if (!question) {
  console.log('Usage: npm run rag:query -- "질문"');
  process.exit(1);
}

const chunks = await retrieve(question).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

if (!chunks.length) console.log("관련 자료가 없어요.");
for (const chunk of chunks) {
  console.log(`\n[${chunk.score.toFixed(3)}] ${chunk.source} ${chunk.page}쪽`);
  console.log(chunk.text.slice(0, 300));
}
