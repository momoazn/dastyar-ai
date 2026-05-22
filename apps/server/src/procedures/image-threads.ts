import { z } from "zod";
import {
  createImageThread,
  deleteImageThread,
  getImageThread,
  listImageThreads,
  renameImageThread,
  setImageThreadArchived,
} from "@/repositories/image-threads";
import { protectedProcedure } from "./base";

export const imageThreadProcedures = {
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input, context }) =>
      createImageThread({ title: input?.title, userId: context.user.id })
    ),

  list: protectedProcedure.handler(async ({ context }) =>
    listImageThreads({
      includeArchived: false,
      userId: context.user.id,
    })
  ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) =>
      getImageThread(input.id, context.user.id)
    ),

  rename: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      await renameImageThread(input.id, input.title, context.user.id);
      return { ok: true } as const;
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await setImageThreadArchived(input.id, true, context.user.id);
      return { ok: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteImageThread(input.id, context.user.id);
      return { ok: true } as const;
    }),
};
