import { type ChatThread, type Message, prisma } from '@/database';

/**
 * Creates a new thread with an optional title.
 * @param params - Optional parameters including title.
 * @returns The ID of the created thread.
 */
export async function createThread(
  params?: Partial<Pick<ChatThread, 'title'>>
): Promise<{ id: number }> {
  try {
    const title = (params?.title ?? 'گفتگوی جدید').trim();

    const thread = await prisma.chatThread.create({
      data: {
        title,
        isArchived: false,
      },
    });

    return { id: thread.id };
  } catch (error) {
    console.error('Failed to create thread:', error);
    throw new Error('Unable to create thread');
  }
}

/**
 * Retrieves a specific thread by ID.
 * @param id - The thread ID.
 * @returns The thread record or null if not found.
 */
export async function getThread(id: number): Promise<ChatThread | null> {
  try {
    const thread = await prisma.chatThread.findUnique({
      where: { id },
    });

    return thread;
  } catch (error) {
    console.error(`Failed to get thread ${id}:`, error);
    throw new Error('Unable to retrieve thread');
  }
}

/**
 * Retrieves all threads, optionally including archived ones.
 * @param options - Options for filtering threads.
 * @returns Array of threads.
 */
export function listThreads(options?: {
  includeArchived?: boolean;
}): Promise<ChatThread[]> {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.chatThread.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
  });
}

/**
 * Renames a thread.
 * @param id - The thread ID.
 * @param title - The new title.
 */
export async function renameThread(id: number, title: string): Promise<void> {
  try {
    await prisma.chatThread.update({
      where: { id },
      data: { title },
    });
  } catch (error) {
    console.error(`Failed to rename thread ${id}:`, error);
    throw new Error('Unable to rename thread');
  }
}

/**
 * Sets the archived status of a thread.
 * @param id - The thread ID.
 * @param isArchived - Whether the thread should be archived.
 */
export async function setArchived(
  id: number,
  isArchived: boolean
): Promise<void> {
  try {
    await prisma.chatThread.update({
      where: { id },
      data: { isArchived },
    });
  } catch (error) {
    console.error(`Failed to set archived status for thread ${id}:`, error);
    throw new Error('Unable to update thread archived status');
  }
}

/**
 * Deletes a thread by ID.
 * @param id - The thread ID.
 */
export async function deleteThread(id: number): Promise<void> {
  try {
    await prisma.chatThread.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete thread ${id}:`, error);
    throw new Error('Unable to delete thread');
  }
}

/**
 * Updates the last message timestamp for a thread.
 * @param threadId - The thread ID.
 * @param date - The timestamp (defaults to current time).
 */
export async function updateThreadOnNewMessage(
  threadId: number,
  date: Date = new Date()
): Promise<void> {
  try {
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: date },
    });
  } catch (error) {
    console.error(`Failed to update thread ${threadId} on new message:`, error);
    throw new Error('Unable to update thread timestamp');
  }
}

/**
 * Loads all messages for a specific thread.
 * @param threadId - The thread ID.
 * @returns Array of messages.
 */
export async function loadThreadMessages(threadId: number): Promise<Message[]> {
  try {
    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  } catch (error) {
    console.error(`Failed to load messages for thread ${threadId}:`, error);
    throw new Error('Unable to load thread messages');
  }
}
