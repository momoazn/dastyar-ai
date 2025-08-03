import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const threadSortOptions = z.enum(["createdAt", "updatedAt", "title"]);
const sortDirection = z.enum(["asc", "desc"]);

export const threadsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200).optional(),
        initialMessage: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.create({
        data: {
          title: input.title,
          messages: input.initialMessage
            ? {
                create: {
                  content: input.initialMessage,
                  role: "user",
                  status: "idle",
                },
              }
            : undefined,
        },
        include: {
          messages: true,
          _count: { select: { messages: true } },
        },
      });

      return thread;
    }),

  getAll: publicProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
        pinnedOnly: z.boolean().default(false),
        favoritesOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        sortBy: threadSortOptions.default("updatedAt"),
        sortDirection: sortDirection.default("desc"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        limit,
        cursor,
        sortBy,
        sortDirection,
        search,
        includeArchived,
        pinnedOnly,
        favoritesOnly,
      } = input;

      const where = {
        archived: includeArchived ? undefined : false,
        ...(pinnedOnly && { pinned: true }),
        ...(favoritesOnly && { favorite: true }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            {
              messages: {
                some: {
                  content: { contains: search, mode: "insensitive" as const },
                },
              },
            },
          ],
        }),
      };

      const threads = await ctx.db.thread.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { [sortBy]: sortDirection },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (threads.length > limit) {
        const nextItem = threads.pop();
        nextCursor = nextItem?.id;
      }

      return {
        threads,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.thread.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { messages: true } },
        },
      });

      if (!thread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      return thread;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        archived: z.boolean().optional(),
        pinned: z.boolean().optional(),
        favorite: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      try {
        const thread = await ctx.db.thread.update({
          where: { id },
          data,
          include: {
            _count: { select: { messages: true } },
          },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.thread.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  bulkDelete: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.thread.deleteMany({
        where: {
          id: { in: input.ids },
        },
      });

      return { deletedCount: result.count };
    }),

  archive: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { archived: true },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  unarchive: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { archived: false },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  bulkArchive: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(50),
        archived: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.thread.updateMany({
        where: {
          id: { in: input.ids },
        },
        data: {
          archived: input.archived,
        },
      });

      return { updatedCount: result.count };
    }),

  pin: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { pinned: true },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  unpin: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { pinned: false },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  addToFavorites: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { favorite: true },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  removeFromFavorites: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const thread = await ctx.db.thread.update({
          where: { id: input.id },
          data: { favorite: false },
        });

        return thread;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const [total, archived, active, pinned, favorites] = await Promise.all([
      ctx.db.thread.count(),
      ctx.db.thread.count({ where: { archived: true } }),
      ctx.db.thread.count({ where: { archived: false } }),
      ctx.db.thread.count({ where: { pinned: true } }),
      ctx.db.thread.count({ where: { favorite: true } }),
    ]);

    const totalMessages = await ctx.db.message.count();

    return {
      total,
      archived,
      active,
      pinned,
      favorites,
      totalMessages,
    };
  }),

  duplicate: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const originalThread = await ctx.db.thread.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!originalThread) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Thread not found",
        });
      }

      const duplicatedThread = await ctx.db.thread.create({
        data: {
          title: input.title ?? `${originalThread.title ?? "Thread"} (Copy)`,
          messages: {
            create: originalThread.messages.map((msg) => ({
              content: msg.content,
              role: msg.role,
              status: "idle",
              reasoning: msg.reasoning,
            })),
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { messages: true } },
        },
      });

      return duplicatedThread;
    }),
});
