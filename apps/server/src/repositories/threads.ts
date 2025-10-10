import type { Message, Thread } from '@prisma/client';
import { prisma } from '@/database';

export async function createThread(params?: Partial<Pick<Thread, 'title'>>) {
  const title = (params?.title ?? 'گفتگوی جدید').trim();

  const thread = await prisma.thread.create({
    data: {
      title,
      isArchived: false,
    },
  });

  return { id: thread.id };
}

export async function getThread(id: number) {
  const thread = await prisma.thread.findUnique({
    where: { id },
  });

  return thread;
}

export function listThreads(options?: { includeArchived?: boolean }) {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.thread.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }],
  });
}

export async function renameThread(id: number, title: string) {
  await prisma.thread.update({
    where: { id },
    data: { title },
  });
}

export async function setArchived(
  id: number,
  isArchived: boolean
) {
  await prisma.thread.update({
    where: { id },
    data: { isArchived },
  });
}

export async function deleteThread(id: number) {
  await prisma.thread.delete({
    where: { id },
  });
}

export async function updateThreadOnNewMessage(
  threadId: number,
  date: Date = new Date()
) {
  await prisma.thread.update({
    where: { id: threadId },
    data: { lastMessageAt: date },
  });
}

export const loadThreadMessages = async (
  threadId: number
): Promise<Message[]> => {
  try {
    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  } catch {
    return [];
  }
};
