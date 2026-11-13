import {
  insertDocumentChunks,
  listChunksForDocuments,
  listThreadDocuments,
} from "@/repositories/documents";
import {
  cosineSimilarity,
  createEmbeddings,
  normalizeVector,
} from "./embeddings";

const PARAGRAPH_SPLIT_REGEX = /\n{2,}/;
// Regex for splitting text into sentences
const SENTENCE_REGEX = /(?<=[.!?\u06D4\u061F])\s+/u;

export type TextChunk = {
  index: number;
  page?: number | null;
  content: string;
};

export function splitTextIntoChunks(
  text: string,
  opts: { chunkSize?: number; overlap?: number } = {}
): TextChunk[] {
  const chunkSize = opts.chunkSize ?? 1400; // approx chars
  const overlap = opts.overlap ?? 200; // chars
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(PARAGRAPH_SPLIT_REGEX)
    .map((p) => p.trim())
    .filter(Boolean);

  // Split paragraphs to sentences to avoid mid-sentence cuts
  const sentences: string[] = [];
  for (const p of paragraphs) {
    const parts = p
      .split(SENTENCE_REGEX)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      // A paragraph without sentence punctuation (common in Persian) can be
      // one huge "sentence"; hard-split it so chunks stay bounded.
      if (part.length <= chunkSize) {
        sentences.push(part);
        continue;
      }
      const step = Math.max(1, chunkSize - overlap);
      for (let start = 0; start < part.length; start += step) {
        sentences.push(part.slice(start, start + chunkSize));
      }
    }
  }

  const chunks: TextChunk[] = [];
  let buffer = "";
  let idx = 0;
  const push = () => {
    if (buffer.trim()) {
      chunks.push({ index: idx++, content: buffer.trim() });
    }
  };
  for (const s of sentences) {
    const candidate = buffer ? `${buffer} ${s}` : s;
    if (candidate.length > chunkSize) {
      push();
      const tail = buffer.slice(Math.max(0, buffer.length - overlap));
      buffer = tail.trim();
    }
    buffer = buffer ? `${buffer} ${s}` : s;
  }
  push();
  return chunks;
}

export async function indexDocumentText(
  documentId: number,
  text: string
): Promise<number> {
  const chunks = splitTextIntoChunks(text);
  const embeddings = await createEmbeddings(chunks.map((c) => c.content));
  const normalized = embeddings.map((e) => normalizeVector(e));
  const rows = chunks.map((c, i) => ({
    index: c.index,
    page: c.page ?? null,
    content: c.content,
    embedding: normalized[i],
  }));
  await insertDocumentChunks(documentId, rows);
  return rows.length;
}

export async function indexDocumentPages(
  documentId: number,
  pages: Array<{ page: number; text: string }>
): Promise<number> {
  let idx = 0;
  const all: TextChunk[] = [];
  for (const p of pages) {
    const ch = splitTextIntoChunks(p.text).map((c) => ({
      ...c,
      page: p.page,
      index: idx++,
    }));
    all.push(...ch);
  }
  if (all.length === 0) {
    return 0;
  }
  const embeddings = await createEmbeddings(all.map((c) => c.content));
  const normalized = embeddings.map((e) => normalizeVector(e));
  const rows = all.map((c, i) => ({
    index: c.index,
    page: c.page ?? null,
    content: c.content,
    embedding: normalized[i],
  }));
  await insertDocumentChunks(documentId, rows);
  return rows.length;
}

export async function retrieveRelevantChunksForThread(params: {
  userId: number;
  threadId: number;
  query: string;
  topK?: number;
}): Promise<
  Array<{
    content: string;
    documentId: number;
    page?: number | null;
    score: number;
    title: string;
  }>
> {
  const docs = await listThreadDocuments({
    threadId: params.threadId,
    userId: params.userId,
  });
  if (docs.length === 0) {
    return [];
  }
  const docIdToTitle = new Map(
    docs.map((d) => [Number(d.id), d.title] as const)
  );
  const chunks = await listChunksForDocuments(docs.map((d) => Number(d.id)));
  if (chunks.length === 0) {
    return [];
  }

  const [q] = await createEmbeddings([params.query]);
  const qn = normalizeVector(q);

  const scored = chunks.map((c) => {
    const emb = (c.embedding as unknown as number[]) || [];
    const score = cosineSimilarity(qn, emb);
    return {
      content: c.content,
      documentId: Number(c.documentId),
      page: (c as unknown as { page?: number | null }).page ?? null,
      score,
      title: docIdToTitle.get(Number(c.documentId)) || "",
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topK = params.topK ?? 4;
  return scored.slice(0, topK);
}

export function buildContextFromChunks(
  chunks: Array<{
    content: string;
    title: string;
    page?: number | null;
    score: number;
  }>
): string {
  if (chunks.length === 0) {
    return "";
  }
  const lines: string[] = [];
  lines.push(
    "You have access to the following user documents. Use them to answer accurately. Cite titles and page numbers when useful.\n"
  );
  for (const [i, c] of chunks.entries()) {
    const header = `[${i + 1}] ${c.title}${c.page ? ` (p.${c.page})` : ""}`;
    lines.push(header);
    lines.push(c.content);
    lines.push("");
  }
  return lines.join("\n");
}
