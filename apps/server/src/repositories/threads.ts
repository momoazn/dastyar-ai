import {
  type ChatThread,
  type LLMModel,
  type Message,
  prisma,
} from "@/database";

/**
 * Creates a new thread with an optional title.
 * @param params - Optional parameters including title and userId.
 * @returns The ID of the created thread.
 */
export async function createThread(
  params?: Partial<Pick<ChatThread, "title">> & { userId: number }
): Promise<{ id: number }> {
  try {
    const title = (params?.title ?? "گفتگوی جدید").trim();

    const thread = await prisma.chatThread.create({
      data: {
        title,
        isArchived: false,
        userId: params?.userId,
      },
    });

    return { id: thread.id };
  } catch (error) {
    console.error("Failed to create thread:", error);
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
  userId: number
): Promise<ChatThread | null> {
  try {
    const thread = await prisma.chatThread.findFirst({
      where: { id, userId },
    });

    return thread;
  } catch (error) {
    console.error(`Failed to get thread ${id}:`, error);
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
  userId: number;
}): Promise<ChatThread[]> {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.chatThread.findMany({
    where: {
      userId: options?.userId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
  });
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
  userId: number
): Promise<void> {
  try {
    await prisma.chatThread.updateMany({
      where: { id, userId },
      data: { title },
    });
  } catch (error) {
    console.error(`Failed to rename thread ${id}:`, error);
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
  userId: number
): Promise<void> {
  try {
    await prisma.chatThread.updateMany({
      where: { id, userId },
      data: { isArchived },
    });
  } catch (error) {
    console.error(`Failed to set archived status for thread ${id}:`, error);
    throw new Error("Unable to update thread archived status");
  }
}

/**
 * Deletes a thread by ID.
 * @param id - The thread ID.
 * @param userId - The user ID.
 */
export async function deleteThread(id: number, userId: number): Promise<void> {
  try {
    await prisma.chatThread.deleteMany({
      where: { id, userId },
    });
  } catch (error) {
    console.error(`Failed to delete thread ${id}:`, error);
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
  userId: number,
  date: Date = new Date()
): Promise<void> {
  try {
    await prisma.chatThread.updateMany({
      where: { id: threadId, userId },
      data: { lastMessageAt: date },
    });
  } catch (error) {
    console.error(`Failed to update thread ${threadId} on new message:`, error);
    throw new Error("Unable to update thread timestamp");
  }
}

export type MessageWithModel = Message & {
  model: Pick<LLMModel, "name" | "provider">;
};

/**
 * Loads all messages for a specific thread.
 * @param threadId - The thread ID.
 * @param userId - The user ID.
 * @returns Array of messages with model relation.
 */
export async function loadThreadMessages(
  threadId: number,
  userId: number
): Promise<MessageWithModel[]> {
  try {
    const messages = await prisma.message.findMany({
      where: { threadId, userId },
      orderBy: { createdAt: "asc" },
      include: {
        model: {
          select: {
            name: true,
            provider: true,
          },
        },
      },
    });

    return messages;
  } catch (error) {
    console.error(`Failed to load messages for thread ${threadId}:`, error);
    throw new Error("Unable to load thread messages");
  }
}
