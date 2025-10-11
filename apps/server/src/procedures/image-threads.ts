import { z } from 'zod';
import {
  createImageThread,
  deleteImageThread,
  getImageThread,
  listImageThreads,
  renameImageThread,
  setImageThreadArchived,
} from '@/repositories/image-threads';
import { protectedProcedure, publicProcedure } from './base';

export const imageThreadProcedures = {
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input, context }) =>
      createImageThread({ title: input?.title, userId: context.user!.id })
    ),

  list: publicProcedure.handler(async () =>
    listImageThreads({ includeArchived: false })
  ),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }: { input: { id: number } }) =>
      getImageThread(input.id)
    ),

  rename: publicProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .handler(async ({ input }: { input: { id: number; title: string } }) => {
      await renameImageThread(input.id, input.title);
      return { ok: true } as const;
    }),

  archive: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }: { input: { id: number } }) => {
      await setImageThreadArchived(input.id, true);
      return { ok: true } as const;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }: { input: { id: number } }) => {
      await deleteImageThread(input.id);
      return { ok: true } as const;
    }),
};
