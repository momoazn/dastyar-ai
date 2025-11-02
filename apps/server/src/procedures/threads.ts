import { z } from "zod";
import { logger } from "@/lib/logger";
import {
  createThread,
  deleteThread,
  getThread,
  listThreads,
  renameThread,
  setArchived,
} from "@/repositories/threads";
import { protectedProcedure } from "./base";

export const threadProcedures = {
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .handler(async ({ input, context }) => {
      const created = await createThread({
        title: input?.title,
        userId: context.user?.id,
      });
      return created;
    }),
  list: protectedProcedure.handler(async ({ context }) => {
    try {
      const rows = await listThreads({
        includeArchived: false,
        userId: context.user?.id,
      });
      return rows;
    } catch (error) {
      logger.error("Failed to list threads", error, {
        userId: context.user?.id,
      });
      return [] as const;
    }
  }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const row = await getThread(input.id, context.user?.id);
      return row;
    }),
  rename: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      await renameThread(input.id, input.title, context.user?.id);
      return { ok: true } as const;
    }),
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await setArchived(input.id, true, context.user?.id);
      return { ok: true } as const;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteThread(input.id, context.user?.id);
      return { ok: true } as const;
    }),
};
