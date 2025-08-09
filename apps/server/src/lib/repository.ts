import type { UIMessage } from 'ai';
import { and, asc, desc, eq, inArray, not } from 'drizzle-orm';
import { db } from '../db';
import { ModelProviderEnum, messages, models, threads } from '../db/schema';
import { listAllModels } from './ai';
import { extractTextFromParts, generateId } from './utils';

export async function syncModels() {
  console.log('--- Syncing models...');

  const allModels = await listAllModels();

  console.log('--- Found', allModels.length, 'models');

  // Prepare rows for upsert (no preloading from DB)
  const rowsToUpsert = allModels.map((m) => ({
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

export async function getModelById(id: string) {
  const rows = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return rows[0] || null;
}

export async function getModelByName(name: string) {
  const rows = await db
    .select()
    .from(models)
    .where(eq(models.name, name))
    .limit(1);
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
