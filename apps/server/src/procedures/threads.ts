import { z } from "zod";
import {
  clearThread,
  deleteMessage,
  getLastUsedModelGlobal,
  getLastUsedModelInThread,
} from "@/repositories/messages";
import {
  createThread,
  deleteThread,
  getThread,
  listThreads,
  loadThreadMessages,
  renameThread,
  setArchived,
} from "@/repositories/threads";
import { convertDbMessagesToUiMessages } from "@/utils/chat";
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
    } catch {
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

export const messageProcedures = {
  listByThread: protectedProcedure
    .input(
      z.object({
        threadId: z.number(),
        limit: z.number().optional(),
        cursor: z.string().optional(),
        order: z.enum(["asc", "desc"]).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const messages = await loadThreadMessages(
        input.threadId,
        context.user?.id
      );
      return convertDbMessagesToUiMessages(messages);
    }),
  getLastUsedModel: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      const lastUsedModel = await getLastUsedModelInThread(
        input.threadId,
        context.user?.id
      );
      return lastUsedModel;
    }),
  getLastUsedModelGlobal: protectedProcedure.handler(async ({ context }) => {
    const lastUsedModel = await getLastUsedModelGlobal(context.user?.id);
    return lastUsedModel;
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteMessage(input.id, context.user?.id);
      return { ok: true } as const;
    }),
  clearThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      await clearThread(input.threadId, context.user?.id);
      return { ok: true } as const;
    }),
};
