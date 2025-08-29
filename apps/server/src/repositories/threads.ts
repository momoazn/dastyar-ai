import { asc, desc, eq } from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { db } from '../database';
import type {
  InsertThreadInput,
  SelectMessageOutput,
  SelectThreadOutput,
} from '../database/schema';
import {
  insertThreadSchema,
  messagesTable,
  selectThreadSchema,
  threads,
} from '../database/schema';
import { generateId } from '../utils/id-generator';

export async function createThread(
  params?: Partial<Pick<InsertThreadInput, 'title'>>
) {
  const id = generateId();
  const title = (params?.title ?? 'گفتگوی جدید').trim();
  const row = insertThreadSchema.parse({ id, title, isArchived: false });
  await db.insert(threads).values(row);
  return { id };
}

export async function getThread(id: SelectThreadOutput['id']) {
  selectThreadSchema.shape.id.parse(id);
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

export async function renameThread(
  id: SelectThreadOutput['id'],
  title: InsertThreadInput['title']
) {
  insertThreadSchema.shape.id.parse(id);
  insertThreadSchema.shape.title.parse(title);
  await db.update(threads).set({ title }).where(eq(threads.id, id));
}

export async function setArchived(
  id: SelectThreadOutput['id'],
  isArchived: InsertThreadInput['isArchived']
) {
  insertThreadSchema.shape.id.parse(id);
  await db.update(threads).set({ isArchived }).where(eq(threads.id, id));
}

export async function deleteThread(id: SelectThreadOutput['id']) {
  insertThreadSchema.shape.id.parse(id);
  await db.delete(threads).where(eq(threads.id, id));
}

export async function updateThreadOnNewMessage(
  threadId: SelectThreadOutput['id'],
  date: Date = new Date()
) {
  await db
    .update(threads)
    .set({ lastMessageAt: date })
    .where(eq(threads.id, threadId));
}

export const loadThreadMessages = async (
  threadId: string
): Promise<SelectMessageOutput[]> => {
  try {
    const result = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.threadId, threadId))
      .orderBy(asc(messagesTable.createdAt));

    console.log('======> result', result);

    return result.map((message) => ({
      ...message,
      parts: message.parts as Json,
    }));
  } catch (error) {
    console.error('======> error in loadThreadMessages', error);
    return [];
  }
};
