import { type LLMModel, type Message, type Prisma, prisma } from '@/database';
import type { MessageStatus } from '@/utils/constants';

export type CreateMessageParams = Omit<
  Message,
  'id' | 'createdAt' | 'updatedAt' | 'parts'
> & {
  parts: Prisma.InputJsonValue;
};

export type UpdateMessageParams = CreateMessageParams & Pick<Message, 'id'>;

/**
 * Saves a single message to the database.
 * @param params - The message parameters excluding auto-generated fields.
 * @returns The ID of the created message.
 */
export async function saveMessage(
  params: CreateMessageParams
): Promise<{ id: number }> {
  try {
    const message = await prisma.message.create({
      data: {
        threadId: params.threadId,
        role: params.role,
        parts: params.parts,
        status: params.status,
        modelId: params.modelId,
      },
    });

    return { id: message.id };
  } catch (error) {
    console.error('Failed to save message:', error);
    throw new Error('Unable to save message');
  }
}

/**
 * Updates an existing message with partial data.
 * @param params - The message ID and fields to update.
 */
export async function updateMessage(
  params: UpdateMessageParams
): Promise<void> {
  try {
    const updateData: Partial<{
      parts: Prisma.InputJsonValue;
      status: MessageStatus;
      modelId: number;
    }> = {};

    if (params.parts !== undefined) {
      updateData.parts = params.parts as Prisma.InputJsonValue;
    }
    if (params.status !== undefined) {
      updateData.status = params.status as MessageStatus;
    }
    if (params.modelId !== undefined) {
      updateData.modelId = params.modelId;
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    await prisma.message.update({
      where: { id: params.id },
      data: updateData,
    });
  } catch (error) {
    console.error(`Failed to update message ${params.id}:`, error);
    throw new Error('Unable to update message');
  }
}

/**
 * Saves multiple messages to the database in a batch operation.
 * @param params - Array of message parameters.
 * @returns The number of messages created.
 */
export async function saveMessages(
  params: CreateMessageParams[]
): Promise<{ count: number }> {
  try {
    if (params.length === 0) {
      return { count: 0 };
    }

    const result = await prisma.message.createMany({
      data: params.map((p) => ({
        threadId: p.threadId,
        role: p.role,
        parts: p.parts,
        status: p.status,
        modelId: p.modelId,
      })),
    });

    return { count: result.count };
  } catch (error) {
    console.error('Failed to save messages:', error);
    throw new Error('Unable to save messages');
  }
}

/**
 * Retrieves messages for a specific thread with optional pagination.
 * @param params - Thread ID and pagination options.
 * @returns Array of messages with model relation.
 */
export async function getMessagesByThread(
  params: { threadId: number } & {
    limit?: number;
    cursor?: string | null;
    order?: 'asc' | 'desc';
  }
): Promise<Message[]> {
  try {
    const limit = params.limit ?? 50;
    const order = params.order ?? 'desc';

    const messages = await prisma.message.findMany({
      where: { threadId: params.threadId },
      orderBy: { createdAt: order },
      take: limit,
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
    console.error(
      `Failed to get messages for thread ${params.threadId}:`,
      error
    );
    throw new Error('Unable to retrieve messages');
  }
}

/**
 * Deletes a specific message by ID.
 * @param id - The message ID.
 */
export async function deleteMessage(id: number): Promise<void> {
  try {
    await prisma.message.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete message ${id}:`, error);
    throw new Error('Unable to delete message');
  }
}

/**
 * Deletes all messages in a specific thread.
 * @param threadId - The thread ID.
 */
export async function clearThread(threadId: number): Promise<void> {
  try {
    await prisma.message.deleteMany({
      where: { threadId },
    });
  } catch (error) {
    console.error(`Failed to clear thread ${threadId}:`, error);
    throw new Error('Unable to clear thread');
  }
}

/**
 * Gets the last used model in a thread.
 * @param threadId - The thread ID.
 * @returns The last used model or null if no messages exist.
 */
export async function getLastUsedModelInThread(
  threadId: number
): Promise<LLMModel | null> {
  try {
    const lastMessage = await prisma.message.findFirst({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });

    return lastMessage?.model || null;
  } catch (error) {
    console.error(
      `Failed to get last used model for thread ${threadId}:`,
      error
    );
    throw new Error('Unable to retrieve last used model');
  }
}

/**
 * Gets the last used model across all messages.
 * @returns The last used model or null if no messages exist.
 */
export async function getLastUsedModelGlobal(): Promise<LLMModel | null> {
  try {
    const lastMessage = await prisma.message.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        model: true,
      },
    });

    return lastMessage?.model || null;
  } catch (error) {
    console.error('Failed to get last used model globally:', error);
    throw new Error('Unable to retrieve last used model');
  }
}
