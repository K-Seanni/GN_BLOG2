// Shared by the ingest script (plain Node) and the chat route, so only relative imports are allowed here.

export const PINECONE_INDEX = process.env.PINECONE_INDEX || "blog-rag";
export const PINECONE_NAMESPACE = "docs";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
export const EMBEDDING_DIMENSION = 768;

export const CHUNK_SIZE = 900;
export const CHUNK_OVERLAP = 150;

export const TOP_K = 4;
// Cosine similarity below this is treated as "not related to the question".
export const MIN_SCORE = 0.55;
