import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  MessagesStatusOptions,
  MessagesRoleOptions,
} from "../../types/pocketbase-types";

export const messagesRouter = createTRPCRouter({
  // Get messages by thread ID
  byThread: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { threadId, page, perPage } = input;

      const messages = await ctx.pb
        .collection("messages")
        .getList(page, perPage, {
          filter: `thread = "${threadId}"`,
          sort: "created",
        });

      return messages;
    }),

  // Create new message
  create: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string(),
        role: z.nativeEnum(MessagesRoleOptions),
        model: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.pb.collection("messages").create({
        thread: input.threadId,
        content: input.content,
        role: input.role,
        model: input.model,
        status: MessagesStatusOptions.idle,
        sentAt: new Date().toISOString(),
      });

      // Update thread's lastMessageAt
      await ctx.pb.collection("threads").update(input.threadId, {
        lastMessageAt: new Date().toISOString(),
      });

      return message;
    }),

  // Update message status and content
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        status: z.nativeEnum(MessagesStatusOptions).optional(),
        reasoning: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const message = await ctx.pb.collection("messages").update(id, data);
      return message;
    }),

  // Delete message
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.pb.collection("messages").delete(input.id);
      return { success: true };
    }),

  // Batch update messages (useful for streaming updates)
  batchUpdate: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          content: z.string().optional(),
          status: z.nativeEnum(MessagesStatusOptions).optional(),
          reasoning: z.string().optional(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedMessages = [];

      for (const update of input) {
        const { id, ...data } = update;
        const message = await ctx.pb.collection("messages").update(id, data);
        updatedMessages.push(message);
      }

      return updatedMessages;
    }),
});
