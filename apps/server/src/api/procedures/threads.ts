import { z } from 'zod';
import { publicProcedure } from '@/api/index';
import { clearThread, deleteMessage } from '@/repositories/messages';
import {
  createThread,
  deleteThread,
  getThread,
  listThreads,
  loadThreadMessages,
  renameThread,
  setArchived,
} from '@/repositories/threads';
import { convertDbMessagesToUiMessages } from '@/utils/chat';

export const threadProcedures = {
  create: publicProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const created = await createThread({ title: input?.title });
      return created;
    }),
  list: publicProcedure.handler(async () => {
    try {
      const rows = await listThreads({
        includeArchived: false,
      });
      return rows;
    } catch {
      return [] as const;
    }
  }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const row = await getThread(input.id);
      return row;
    }),
  rename: publicProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1) }))
    .handler(async ({ input }) => {
      await renameThread(input.id, input.title);
      return { ok: true } as const;
    }),
  archive: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await setArchived(input.id, true);
      return { ok: true } as const;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteThread(input.id);
      return { ok: true } as const;
    }),
};

export const messageProcedures = {
  listByThread: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
        order: z.enum(['asc', 'desc']).optional(),
      })
    )
    .handler(async ({ input }) => {
      const messages = await loadThreadMessages(input.threadId);
      return convertDbMessagesToUiMessages(messages);
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteMessage(input.id);
      return { ok: true } as const;
    }),
  clearThread: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .handler(async ({ input }) => {
      await clearThread(input.threadId);
      return { ok: true } as const;
    }),
};
