import { asc, desc, eq } from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { db } from '@/database';
import type {
  InsertMessageInput,
  SelectMessageOutput,
} from '@/database/schema';
import {
  insertMessageSchema,
  messagesTable,
  selectMessageSchema,
} from '@/database/schema';
import type { MessageStatus } from '@/utils/constants';
import { generateId } from '@/utils/id-generator';

export async function saveMessage(
  params: Omit<InsertMessageInput, 'id'> & { id?: InsertMessageInput['id'] }
) {
  const id = params.id ?? generateId();
  const row = insertMessageSchema.parse({
    id,
    threadId: params.threadId,
    role: params.role,
    parts: params.parts,
    status: params.status,
    modelName: params.modelName,
  });
  await db.insert(messagesTable).values(row);
  return { id };
}

export async function updateMessage(
  params: Pick<InsertMessageInput, 'id'> &
    Partial<Pick<InsertMessageInput, 'parts' | 'status' | 'modelName'>>
) {
  selectMessageSchema.shape.id.parse(params.id);
  const update: Partial<{
    parts: Json;
    status: MessageStatus;
    modelName: string;
  }> = {};

  if (params.parts !== undefined) {
    insertMessageSchema.shape.parts.parse(params.parts);
    update.parts = params.parts;
  }
  if (params.status !== undefined) {
    insertMessageSchema.shape.status.parse(params.status);
    update.status = params.status as MessageStatus;
  }
  if (params.modelName !== undefined) {
    insertMessageSchema.shape.modelName.parse(params.modelName);
    update.modelName = params.modelName;
  }
  if (Object.keys(update).length === 0) {
    return;
  }
  await db
    .update(messagesTable)
    .set(update)
    .where(eq(messagesTable.id, params.id));
}

export async function saveMessages(
  params: Array<
    Omit<InsertMessageInput, 'id'> & { id?: InsertMessageInput['id'] }
  >
) {
  const prepared = params.map((p) => {
    const id = p.id ?? generateId();
    const row = insertMessageSchema.parse({
      id,
      threadId: p.threadId,
      role: p.role,
      parts: p.parts,
      status: p.status,
      modelName: p.modelName,
    });
    return row;
  });
  if (prepared.length === 0) {
    return { ids: [] };
  }
  await db.insert(messagesTable).values(prepared);
  return { ids: prepared.map((r) => r.id) };
}

export async function getMessagesByThread(
  params: Pick<InsertMessageInput, 'threadId'> & {
    limit?: number;
    cursor?: string | null;
    order?: 'asc' | 'desc';
  }
) {
  insertMessageSchema.shape.threadId.parse(params.threadId);
  const limit = params.limit ?? 50;
  const order = params.order ?? 'desc';
  const query = db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.threadId, params.threadId));
  const ordered =
    order === 'asc'
      ? query.orderBy(asc(messagesTable.createdAt))
      : query.orderBy(desc(messagesTable.createdAt));
  const rows = await ordered.limit(limit);
  return rows;
}

export async function deleteMessage(id: SelectMessageOutput['id']) {
  await db.delete(messagesTable).where(eq(messagesTable.id, id));
}

export async function clearThread(threadId: InsertMessageInput['threadId']) {
  await db.delete(messagesTable).where(eq(messagesTable.threadId, threadId));
}
