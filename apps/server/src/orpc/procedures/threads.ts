import { z } from 'zod';
import {
  clearThread,
  createThread,
  deleteMessage,
  deleteThread,
  getMessagesByThread,
  getThread,
  listThreads,
  renameThread,
  setArchived,
} from '../../lib/repository';
import { publicProcedure } from '../index';

export const threadProcedures = {
  create: publicProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const created = await createThread({ title: input?.title });
      return created;
    }),
  list: publicProcedure
    .input(
      z
        .object({ includeArchived: z.boolean().optional().default(false) })
        .optional()
    )
    .handler(async ({ input }) => {
      try {
        const rows = await listThreads({
          includeArchived: input?.includeArchived,
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
      const rows = await getMessagesByThread({
        threadId: input.threadId,
        limit: input.limit,
        cursor: input.cursor ?? null,
        order: input.order ?? 'desc',
      });
      return rows;
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
