import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const messageRoleSchema = z.enum(["user", "assistant"]);
const messageStatusSchema = z.enum([
  "idle",
  "reasoning",
  "streaming",
  "finished",
  "errored",
  "stopped",
]);

export const messagesRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        role: messageRoleSchema,
        status: messageStatusSchema.default("idle"),
        reasoning: z.string().optional(),
        model: z.string().optional(),
        tokenCount: z.number().optional(),
        duration: z.number().optional(),
        error: z.string().optional(),
        threadId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const message = await ctx.db.message.create({
          data: input,
          include: {
            thread: {
              select: { id: true, title: true },
            },
          },
        });

        return message;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create message",
        });
      }
    }),

  getByThreadId: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { threadId, limit, cursor } = input;

      const messages = await ctx.db.message.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        status: messageStatusSchema.optional(),
        reasoning: z.string().optional(),
        model: z.string().optional(),
        tokenCount: z.number().optional(),
        duration: z.number().optional(),
        error: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      try {
        const message = await ctx.db.message.update({
          where: { id },
          data,
        });

        return message;
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.message.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }
    }),

  bulkDelete: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.message.deleteMany({
        where: {
          id: { in: input.ids },
        },
      });

      return { deletedCount: result.count };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: messageStatusSchema,
        error: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const message = await ctx.db.message.update({
          where: { id: input.id },
          data: {
            status: input.status,
            error: input.error,
          },
        });

        return message;
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }
    }),

  getLatestByThreadId: publicProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const message = await ctx.db.message.findFirst({
        where: { threadId: input.threadId },
        orderBy: { createdAt: "desc" },
      });

      return message;
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const [total, byRole, byStatus] = await Promise.all([
      ctx.db.message.count(),
      ctx.db.message.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
      ctx.db.message.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce(
        (acc, item) => {
          acc[item.role] = item._count._all;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count._all;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        threadId: z.string().optional(),
        role: messageRoleSchema.optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, threadId, role, limit } = input;

      const messages = await ctx.db.message.findMany({
        where: {
          content: {
            contains: query,
          },
          ...(threadId && { threadId }),
          ...(role && { role }),
        },
        include: {
          thread: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return messages;
    }),
});
