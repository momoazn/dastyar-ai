import type { UIMessage } from 'ai';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { messages, models, threads } from '../db/schema';
import { generateId } from './ids';
import { extractTextFromParts } from './utils';

export async function getModelById(id: string) {
  const rows = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return rows[0] || null;
}

export async function createThread(params?: { title?: string }) {
  const id = generateId();
  const title = params?.title?.trim() || 'New Chat';
  await db.insert(threads).values({ id, title, isArchived: false });
  return { id };
}

export async function getThread(id: string) {
  const rows = await db
    .select()
    .from(threads)
    .where(eq(threads.id, id))
    .limit(1);
  return rows[0] || null;
}

export function listThreads(options?: { includeArchived?: boolean }) {
  const includeArchived = options?.includeArchived ?? false;
  const baseQuery = db.select().from(threads);
  const query = includeArchived
    ? baseQuery
    : baseQuery.where(eq(threads.isArchived, false));
  return query.orderBy(desc(threads.lastMessageAt), desc(threads.updatedAt));
}

export async function renameThread(id: string, title: string) {
  await db.update(threads).set({ title }).where(eq(threads.id, id));
}

export async function setArchived(id: string, isArchived: boolean) {
  await db.update(threads).set({ isArchived }).where(eq(threads.id, id));
}

export async function deleteThread(id: string) {
  await db.delete(threads).where(eq(threads.id, id));
}

export async function saveMessage(params: {
  id?: string;
  threadId: string;
  role: 'user' | 'assistant';
  uiMessage?: UIMessage; // optional raw UI message (assistant)
  content?: string; // raw text (user)
  reasoning?: string | null;
  status?: string | null;
  modelId?: string | null;
  sentAt?: Date | null;
}) {
  const id = params.id ?? generateId();
  let content = params.content ?? '';
  let reasoning = params.reasoning ?? null;
  if (params.uiMessage) {
    const parts = extractTextFromParts(params.uiMessage);
    content = parts.content;
    reasoning = parts.reasoning;
  }
  await db.insert(messages).values({
    id,
    threadId: params.threadId,
    role: params.role,
    content,
    reasoning,
    status: params.status ?? null,
    modelId: params.modelId ?? null,
    sentAt: params.sentAt ?? new Date(),
  });
  return { id };
}

export async function getMessagesByThread(params: {
  threadId: string;
  limit?: number;
  cursor?: string | null;
  order?: 'asc' | 'desc';
}) {
  const limit = params.limit ?? 50;
  const order = params.order ?? 'desc';
  const query = db
    .select()
    .from(messages)
    .where(eq(messages.threadId, params.threadId));
  const ordered =
    order === 'asc'
      ? query.orderBy(asc(messages.sentAt), asc(messages.createdAt))
      : query.orderBy(desc(messages.sentAt), desc(messages.createdAt));
  const rows = await ordered.limit(limit);
  return rows;
}

export async function deleteMessage(id: string) {
  await db.delete(messages).where(eq(messages.id, id));
}

export async function clearThread(threadId: string) {
  await db.delete(messages).where(eq(messages.threadId, threadId));
}

export async function updateThreadOnNewMessage(
  threadId: string,
  date: Date = new Date()
) {
  await db
    .update(threads)
    .set({ lastMessageAt: date })
    .where(eq(threads.id, threadId));
}
