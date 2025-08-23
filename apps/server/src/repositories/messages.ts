import { asc, desc, eq } from 'drizzle-orm';
import type {
  InsertMessageInput,
  InsertModelInput,
  SelectMessageOutput,
} from '../database/schema';
import {
  insertMessageSchema,
  insertModelSchema,
  messages,
  selectMessageSchema,
} from '../database/schema';
import { db } from '../database';
import { generateId } from '../utils/id-generator';

export async function saveMessage(
  params: Omit<InsertMessageInput, 'id'> & { id?: InsertMessageInput['id'] }
) {
  const id = params.id ?? generateId();
  const row = insertMessageSchema.parse({
    id,
    threadId: params.threadId,
    role: params.role,
    content: params.content,
    reasoning: params.reasoning ?? null,
    status: params.status ?? null,
    modelId: params.modelId ?? null,
    sentAt: params.sentAt ?? new Date(),
  });
  await db.insert(messages).values(row);
  return { id };
}

export async function updateMessage(
  params: Pick<InsertMessageInput, 'id'> &
    Partial<
      Pick<
        InsertMessageInput,
        'content' | 'reasoning' | 'status' | 'modelId' | 'sentAt'
      >
    >
) {
  selectMessageSchema.shape.id.parse(params.id);
  const update: Partial<{
    content: string;
    reasoning: string | null;
    status: string | null;
    modelId: string | null;
    sentAt: Date | null;
  }> = {};
  if (params.content !== undefined) {
    insertMessageSchema.shape.content.parse(params.content);
    update.content = params.content;
  }
  if (params.reasoning !== undefined) {
    update.reasoning = params.reasoning;
  }
  if (params.status !== undefined) {
    insertMessageSchema.shape.status.parse(params.status);
    update.status = params.status;
  }
  if (params.modelId !== undefined) {
    insertModelSchema.shape.id.parse(params.modelId);
    update.modelId = params.modelId;
  }
  if (params.sentAt !== undefined) {
    update.sentAt = params.sentAt;
  }
  if (Object.keys(update).length === 0) {
    return;
  }
  await db.update(messages).set(update).where(eq(messages.id, params.id));
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
      content: p.content,
      reasoning: p.reasoning ?? null,
      status: p.status ?? null,
      modelId: p.modelId ?? null,
      sentAt: p.sentAt ?? new Date(),
    });
    return row;
  });
  if (prepared.length === 0) {
    return { ids: [] };
  }
  await db.insert(messages).values(prepared);
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
    .from(messages)
    .where(eq(messages.threadId, params.threadId));
  const ordered =
    order === 'asc'
      ? query.orderBy(asc(messages.sentAt), asc(messages.createdAt))
      : query.orderBy(desc(messages.sentAt), desc(messages.createdAt));
  const rows = await ordered.limit(limit);
  return rows;
}

export async function deleteMessage(id: SelectMessageOutput['id']) {
  await db.delete(messages).where(eq(messages.id, id));
}

export async function clearThread(threadId: InsertMessageInput['threadId']) {
  await db.delete(messages).where(eq(messages.threadId, threadId));
}