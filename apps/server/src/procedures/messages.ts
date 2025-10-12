import { z } from "zod";
import {
  clearThread,
  deleteMessage,
  getLastUsedModelGlobal,
  getLastUsedModelInThread,
} from "@/repositories/messages";
import { loadThreadMessages } from "@/repositories/threads";
import { convertDbMessagesToUiMessages } from "@/utils/chat";
import { protectedProcedure } from "./base";

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
        context.user.id
      );
      return convertDbMessagesToUiMessages(messages);
    }),
  getLastUsedModel: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      const lastUsedModel = await getLastUsedModelInThread(
        input.threadId,
        context.user.id
      );
      return lastUsedModel;
    }),
  getLastUsedModelGlobal: protectedProcedure.handler(async ({ context }) => {
    const lastUsedModel = await getLastUsedModelGlobal(context.user.id);
    return lastUsedModel;
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteMessage(input.id, context.user.id);
      return { ok: true } as const;
    }),
  clearThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      await clearThread(input.threadId, context.user.id);
      return { ok: true } as const;
    }),
};
