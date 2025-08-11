import { and, asc, desc, eq, inArray, not } from 'drizzle-orm';
import type {
  InsertMessageInput,
  InsertThreadInput,
  SelectMessageOutput,
  SelectModelOutput,
  SelectThreadOutput,
  SelectTranslationOutput,
} from '@/db/schema';
import {
  insertMessageSchema,
  insertModelSchema,
  insertThreadSchema,
  ModelProviderEnum,
  messages,
  models,
  selectMessageSchema,
  selectModelSchema,
  selectThreadSchema,
  selectTranslationSchema,
  threads,
  translations,
} from '@/db/schema';
import { db } from '../db';
import { listAllModels } from './providers';
import { generateId } from './utils';

export async function syncModels() {
  console.log('--- Syncing models...');

  const allModels = await listAllModels();

  console.log('--- Found', allModels.length, 'models');

  // Prepare rows for upsert (no preloading from DB)
  const rowsToUpsert = allModels.map((m: { id: string; provider: string }) => ({
    id: generateId(),
    name: m.id,
    provider: m.provider,
    isEnabled: true,
  }));

  if (rowsToUpsert.length > 0) {
    // Single bulk insert; on conflicts (provider, name) do nothing (no updates)
    await db
      .insert(models)
      .values(rowsToUpsert)
      .onConflictDoNothing({ target: [models.provider, models.name] });
  }

  // Enable models that are present in the latest provider lists
  const modelsByProvider = new Map<string, string[]>();
  for (const m of allModels) {
    const list = modelsByProvider.get(m.provider) ?? [];
    list.push(m.id);
    modelsByProvider.set(m.provider, list);
  }

  const enableUpdates: Promise<unknown>[] = [];
  for (const [provider, names] of modelsByProvider.entries()) {
    if (names.length > 0) {
      enableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: true })
          .where(
            and(eq(models.provider, provider), inArray(models.name, names))
          )
      );
    }
  }

  // Disable models that are NOT present in the latest lists (per provider)
  // If a provider had no models returned, disable all of that provider.
  const allProviders = Object.values(ModelProviderEnum);
  const disableUpdates: Promise<unknown>[] = [];
  for (const provider of allProviders) {
    const names = modelsByProvider.get(provider) ?? [];
    if (names.length === 0) {
      disableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: false })
          .where(eq(models.provider, provider))
      );
    } else {
      disableUpdates.push(
        db
          .update(models)
          .set({ isEnabled: false })
          .where(
            and(eq(models.provider, provider), not(inArray(models.name, names)))
          )
      );
    }
  }

  await Promise.all([...enableUpdates, ...disableUpdates]);

  console.log('--- Models synced');
}

export async function getModelById(id: SelectModelOutput['id']) {
  // Validate using schema id
  selectModelSchema.shape.id.parse(id);
  const rows = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return rows[0] || null;
}

export async function getModelByName(name: SelectModelOutput['name']) {
  // Validate using schema name
  selectModelSchema.shape.name.parse(name);
  const rows = await db
    .select()
    .from(models)
    .where(eq(models.name, name))
    .limit(1);
  return rows[0] || null;
}

export async function createThread(
  params?: Partial<Pick<InsertThreadInput, 'title'>>
) {
  const id = generateId();
  const title = (params?.title ?? 'New Chat').trim();
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

export async function updateThreadOnNewMessage(
  threadId: SelectThreadOutput['id'],
  date: Date = new Date()
) {
  await db
    .update(threads)
    .set({ lastMessageAt: date })
    .where(eq(threads.id, threadId));
}

export function listTranslations() {
  return db.select().from(translations);
}

export async function getTranslation(id: SelectTranslationOutput['id']) {
  selectTranslationSchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(translations)
    .where(eq(translations.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteTranslation(id: SelectTranslationOutput['id']) {
  await db.delete(translations).where(eq(translations.id, id));
}
