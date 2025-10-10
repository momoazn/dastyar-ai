import prisma from '@/database';
import type { MessageStatus } from '@/utils/constants';
import type { Message, Prisma } from '../../generated/prisma';

export async function saveMessage(
  params: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'parts'> & {
    parts: Prisma.InputJsonValue;
  }
) {
  const message = await prisma.message.create({
    data: {
      threadId: params.threadId,
      role: params.role,
      parts: params.parts,
      status: params.status,
      modelName: params.modelName,
    },
  });

  return { id: message.id };
}

export async function updateMessage(
  params: { id: number } & Partial<
    Pick<Message, 'parts' | 'status' | 'modelName'>
  >
) {
  const updateData: Partial<{
    parts: Prisma.InputJsonValue;
    status: MessageStatus;
    modelName: string;
  }> = {};

  if (params.parts !== undefined) {
    updateData.parts = params.parts as Prisma.InputJsonValue;
  }
  if (params.status !== undefined) {
    updateData.status = params.status as MessageStatus;
  }
  if (params.modelName !== undefined) {
    updateData.modelName = params.modelName;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await prisma.message.update({
    where: { id: params.id },
    data: updateData,
  });
}

export async function saveMessages(
  params: Array<
    Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'parts'> & {
      parts: Prisma.InputJsonValue;
    }
  >
) {
  if (params.length === 0) {
    return { ids: [] };
  }

  await prisma.message.createMany({
    data: params.map((p) => ({
      threadId: p.threadId,
      role: p.role,
      parts: p.parts,
      status: p.status,
      modelName: p.modelName,
    })),
  });

  return { ids: [] };
}

export async function getMessagesByThread(
  params: { threadId: number } & {
    limit?: number;
    cursor?: string | null;
    order?: 'asc' | 'desc';
  }
) {
  const limit = params.limit ?? 50;
  const order = params.order ?? 'desc';

  const messages = await prisma.message.findMany({
    where: { threadId: params.threadId },
    orderBy: { createdAt: order },
    take: limit,
  });

  return messages;
}

export async function deleteMessage(id: number) {
  await prisma.message.delete({
    where: { id },
  });
}

export async function clearThread(threadId: number) {
  await prisma.message.deleteMany({
    where: { threadId },
  });
}
