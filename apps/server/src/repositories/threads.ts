import { and, asc, desc, eq } from "drizzle-orm";
import {
  type ChatThread,
  chatThreads,
  db,
  type Json,
  type LLMModel,
  llmModels,
  type Message,
  messages,
} from "@/database";
import { logger } from "@/lib/logger";

/**
 * Creates a new thread with an optional title.
 * @param params - Optional parameters including title and userId.
 * @returns The ID of the created thread.
 */
export async function createThread(
  params: Partial<Pick<ChatThread, "title">> & { userId?: number }
): Promise<{ id: number }> {
  try {
    if (!params.userId) {
      throw new Error("User id is required to create a thread");
    }
    const title = (params?.title ?? "گفتگوی جدید").trim();

    const result = await db
      .insert(chatThreads)
      .values({
        title,
        isArchived: false,
        userId: params.userId,
      })
      .returning();

    return { id: Number(result.at(0)?.id) };
  } catch (error) {
    logger.error("Failed to create thread:", error, { function: "threads" });
    throw new Error("Unable to create thread");
  }
}

/**
 * Retrieves a specific thread by ID.
 * @param id - The thread ID.
 * @param userId - The user ID.
 * @returns The thread record or null if not found.
 */
export async function getThread(
  id: number,
  userId: number | undefined
): Promise<ChatThread | null> {
  try {
    if (!userId) {
      throw new Error("User id is required to load thread");
    }
    const rows = await db
      .select()
      .from(chatThreads)
      .where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    logger.error("Failed to get thread", error, { id });
    throw new Error("Unable to retrieve thread");
  }
}

/**
 * Retrieves all threads, optionally including archived ones.
 * @param options - Options for filtering threads.
 * @returns Array of threads.
 */
export function listThreads(options?: {
  includeArchived?: boolean;
  userId?: number;
}): Promise<ChatThread[]> {
  const includeArchived = options?.includeArchived ?? false;
  if (!options?.userId) {
    throw new Error("User id is required to list threads");
  }

  const conditions = [eq(chatThreads.userId, options.userId)];
  if (!includeArchived) {
    conditions.push(eq(chatThreads.isArchived, false));
  }
  if (conditions.length === 1) {
    return db
      .select()
      .from(chatThreads)
      .where(conditions[0])
      .orderBy(desc(chatThreads.lastMessageAt), desc(chatThreads.updatedAt));
  }
  return db
    .select()
    .from(chatThreads)
    .where(and(...conditions))
    .orderBy(desc(chatThreads.lastMessageAt), desc(chatThreads.updatedAt));
}

/**
 * Renames a thread.
 * @param id - The thread ID.
 * @param title - The new title.
 * @param userId - The user ID.
 */
export async function renameThread(
  id: number,
  title: string,
  userId: number | undefined
): Promise<void> {
  try {
    if (!userId) {
      throw new Error("User id is required to rename thread");
    }
    await db
      .update(chatThreads)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to rename thread", error, { id });
    throw new Error("Unable to rename thread");
  }
}

/**
 * Sets the archived status of a thread.
 * @param id - The thread ID.
 * @param isArchived - Whether the thread should be archived.
 * @param userId - The user ID.
 */
export async function setArchived(
  id: number,
  isArchived: boolean,
  userId: number | undefined
): Promise<void> {
  try {
    if (!userId) {
      throw new Error("User id is required to update archive status");
    }
    await db
      .update(chatThreads)
      .set({
        isArchived,
        updatedAt: new Date(),
      })
      .where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to set archived status for thread", error, { id });
    throw new Error("Unable to update thread archived status");
  }
}

/**
 * Deletes a thread by ID.
 * @param id - The thread ID.
 * @param userId - The user ID.
 */
export async function deleteThread(
  id: number,
  userId: number | undefined
): Promise<void> {
  try {
    if (!userId) {
      throw new Error("User id is required to delete thread");
    }
    await db
      .delete(chatThreads)
      .where(and(eq(chatThreads.id, id), eq(chatThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to delete thread", error, { id });
    throw new Error("Unable to delete thread");
  }
}

/**
 * Updates the last message timestamp for a thread.
 * @param threadId - The thread ID.
 * @param userId - The user ID.
 * @param date - The timestamp (defaults to current time).
 */
export async function updateThreadOnNewMessage(
  threadId: number,
  userId: number | undefined,
  date: Date = new Date()
): Promise<void> {
  try {
    if (!userId) {
      throw new Error("User id is required to update thread");
    }
    await db
      .update(chatThreads)
      .set({
        lastMessageAt: date,
        updatedAt: date,
      })
      .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to update thread on new message", error, { threadId });
    throw new Error("Unable to update thread timestamp");
  }
}

export type MessageWithModel = Message & {
  model: Pick<LLMModel, "identifier" | "provider">;
};

/**
 * Loads all messages for a specific thread.
 * @param threadId - The thread ID.
 * @param userId - The user ID.
 * @returns Array of messages with model relation.
 */
export async function loadThreadMessages(
  threadId: number,
  userId: number | undefined
): Promise<MessageWithModel[]> {
  try {
    if (!userId) {
      throw new Error("User id is required to load thread messages");
    }
    const rows = await db
      .select({
        id: messages.id,
        parts: messages.parts,
        status: messages.status,
        role: messages.role,
        modelId: messages.modelId,
        threadId: messages.threadId,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        userId: messages.userId,
        modelIdentifier: llmModels.identifier,
        modelProvider: llmModels.provider,
      })
      .from(messages)
      .innerJoin(llmModels, eq(messages.modelId, llmModels.id))
      .where(and(eq(messages.threadId, threadId), eq(messages.userId, userId)))
      .orderBy(asc(messages.createdAt));

    return rows.map((row) => ({
      id: row.id,
      parts: row.parts as Json,
      status: row.status,
      role: row.role,
      modelId: row.modelId,
      threadId: row.threadId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userId: row.userId,
      model: {
        identifier: row.modelIdentifier,
        provider: row.modelProvider,
      },
    }));
  } catch (error) {
    logger.error("Failed to load messages for thread", error, { threadId });
    throw new Error("Unable to load thread messages");
  }
}
