import { Pinecone } from "@pinecone-database/pinecone";
import { EMBEDDING_DIMENSION, PINECONE_INDEX, PINECONE_NAMESPACE } from "./config.ts";

export type ChunkMetadata = {
  source: string;
  page: number;
  text: string;
};

let client: Pinecone | null = null;
let hostCache: string | null = null;

function getClient() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  client ??= new Pinecone({ apiKey });
  return client;
}

async function findHost() {
  getClient(); // fails early with a clear message when the API key is missing
  try {
    return (await getClient().indexes.describe(PINECONE_INDEX)).host;
  } catch {
    return null;
  }
}

// Creates the serverless index the first time the ingest script runs.
export async function ensureIndexHost() {
  hostCache ??= await findHost();
  if (hostCache) return hostCache;

  console.log(`Creating Pinecone index "${PINECONE_INDEX}" (${EMBEDDING_DIMENSION} dims, cosine)...`);
  const created = await getClient().indexes.create({
    name: PINECONE_INDEX,
    schema: {
      fields: { _values: { type: "dense_vector", dimension: EMBEDDING_DIMENSION, metric: "cosine" } },
    },
    deployment: { deploymentType: "managed", cloud: "aws", region: "us-east-1" },
    waitUntilReady: true,
  });
  hostCache = created.host;
  return hostCache;
}

export async function getIndex() {
  hostCache ??= await findHost();
  if (!hostCache) throw new Error(`Pinecone index "${PINECONE_INDEX}" does not exist. Run npm run rag:ingest first.`);
  return getClient().index({ host: hostCache, namespace: PINECONE_NAMESPACE });
}

export async function getIndexForIngest() {
  const host = await ensureIndexHost();
  return getClient().index({ host, namespace: PINECONE_NAMESPACE });
}
