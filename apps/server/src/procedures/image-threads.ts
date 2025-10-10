import { z } from 'zod';
import {
  createImageThread,
  deleteImageThread,
  getImageThread,
  listImageThreads,
  renameImageThread,
  setImageThreadArchived,
} from '@/repositories/image-threads';
import { publicProcedure } from './base';

export const imageThreadProcedures = {
  create: publicProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input }) => createImageThread({ title: input?.title })),

  list: publicProcedure.handler(async () =>
    listImageThreads({ includeArchived: false })
  ),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => getImageThread(input.id)),

  rename: publicProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .handler(async ({ input }) => {
      await renameImageThread(input.id, input.title);
      return { ok: true } as const;
    }),

  archive: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await setImageThreadArchived(input.id, true);
      return { ok: true } as const;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteImageThread(input.id);
      return { ok: true } as const;
    }),
};
