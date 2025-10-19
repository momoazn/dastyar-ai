import type { OpenAI } from "openai";
import { env } from "@/config";
import { ollamaClient } from "../ai-providers/ollama-provider";

export type EmbeddingVector = number[];

/**
 * Create embeddings for an array of texts using Ollama's /v1/embeddings endpoint.
 * The embedding model is configured via EMBEDDING_MODEL env var.
 */
export async function createEmbeddings(
  texts: string[],
  client: OpenAI = ollamaClient
): Promise<EmbeddingVector[]> {
  if (texts.length === 0) {
    return [];
  }
  const model = env.EMBEDDING_MODEL;
  const response = await client.embeddings.create({
    model,
    input: texts,
  });

  // The OpenAI response returns data in the same order
  return response.data.map((d) => d.embedding as number[]);
}

/** Normalize a vector to unit length for efficient cosine similarity */
export function normalizeVector(vec: EmbeddingVector): EmbeddingVector {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0) || 1);
  return vec.map((v) => v / norm);
}

/** Cosine similarity for two already-normalized vectors */
export function cosineSimilarity(
  a: EmbeddingVector,
  b: EmbeddingVector
): number {
  // Assume a and b are same length and normalized
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}
