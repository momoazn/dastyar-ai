import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  chatThreads,
  type Document,
  type DocumentChunk,
  db,
  documentChunks,
  documents,
  type Json,
  threadDocuments,
} from "@/database";

export async function createDocument(rec: {
  title: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  userId: number;
}): Promise<Document> {
  const res = await db
    .insert(documents)
    .values({
      title: rec.title,
      filePath: rec.filePath,
      fileName: rec.fileName,
      mimeType: rec.mimeType,
      userId: rec.userId,
    })
    .returning();
  const id = Number(res.at(0)?.id);
  const created = await getDocumentById(id, rec.userId);
  if (!created) {
    throw new Error("Document insert failed");
  }
  return created;
}

export async function getDocumentById(
  id: number,
  userId: number
): Promise<Document | null> {
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .limit(1);
  return rows.at(0) ?? null;
}

export async function listDocumentsByUser(userId: number): Promise<Document[]> {
  return await db
    .select()
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function attachDocumentToThread(params: {
  threadId: number;
  documentId: number;
  userId: number;
}): Promise<void> {
  // Ensure thread belongs to user
  const row = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.id, params.threadId),
        eq(chatThreads.userId, params.userId)
      )
    )
    .limit(1);
  if (!row.at(0)) {
    throw new Error("Thread not found for user");
  }

  await db
    .insert(threadDocuments)
    .values({ threadId: params.threadId, documentId: params.documentId })
    .run();
}

export async function detachDocumentFromThread(params: {
  threadId: number;
  documentId: number;
  userId: number;
}): Promise<void> {
  // We rely on subquery to restrict by user's threads
  const threadRows = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.id, params.threadId),
        eq(chatThreads.userId, params.userId)
      )
    )
    .limit(1);
  if (!threadRows.at(0)) {
    throw new Error("Thread not found for user");
  }
  await db
    .delete(threadDocuments)
    .where(
      and(
        eq(threadDocuments.threadId, params.threadId),
        eq(threadDocuments.documentId, params.documentId)
      )
    )
    .run();
}

export async function listThreadDocuments(params: {
  threadId: number;
  userId: number;
}): Promise<Document[]> {
  const threadRows = await db
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.id, params.threadId),
        eq(chatThreads.userId, params.userId)
      )
    )
    .limit(1);
  if (!threadRows.at(0)) {
    return [];
  }

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      filePath: documents.filePath,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
      userId: documents.userId,
    })
    .from(threadDocuments)
    .innerJoin(documents, eq(threadDocuments.documentId, documents.id))
    .where(eq(threadDocuments.threadId, params.threadId))
    .orderBy(asc(documents.title));

  return rows;
}

export async function insertDocumentChunks(
  docId: number,
  chunks: Array<{
    index: number;
    page?: number | null;
    content: string;
    embedding: number[];
  }>
): Promise<number> {
  if (chunks.length === 0) {
    return 0;
  }
  const values = chunks.map((c) => ({
    documentId: docId,
    chunkIndex: c.index,
    page: c.page ?? null,
    content: c.content,
    embedding: c.embedding as Json,
  }));
  await db.insert(documentChunks).values(values).run();
  return chunks.length;
}

export async function listChunksForDocuments(
  documentIds: number[]
): Promise<(DocumentChunk & { documentId: number })[]> {
  if (documentIds.length === 0) {
    return [];
  }
  const rows = await db
    .select()
    .from(documentChunks)
    .where(inArray(documentChunks.documentId, documentIds))
    .orderBy(asc(documentChunks.documentId), asc(documentChunks.chunkIndex));
  return rows as (DocumentChunk & { documentId: number })[];
}

export async function deleteDocument(
  id: number,
  userId: number
): Promise<void> {
  const doc = await getDocumentById(id, userId);
  if (!doc) {
    throw new Error("Document not found");
  }
  await db.delete(documents).where(eq(documents.id, id)).run();
}
