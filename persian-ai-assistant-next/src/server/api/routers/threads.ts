import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const threadsRouter = createTRPCRouter({
  // List threads with pagination and filtering
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(20),
        archived: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, archived } = input;

      let filter = "";
      if (archived !== undefined) {
        filter = `isArchived = ${archived}`;
      }

      const threads = await ctx.pb
        .collection("threads")
        .getList(page, perPage, {
          filter,
          sort: "-lastMessageAt",
        });

      return threads;
    }),

  // Get single thread by ID
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const thread = await ctx.pb.collection("threads").getOne(input.id);
      return thread;
    }),

  // Create new thread with Persian title
  create: publicProcedure
    .input(
      z.object({
        title: z.string().optional().default("�A*�H� ,/�/"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.pb.collection("threads").create({
        title: input.title,
        isArchived: false,
        lastMessageAt: new Date().toISOString(),
      });

      return thread;
    }),

  // Update thread properties (title, archived status)
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        isArchived: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const thread = await ctx.pb.collection("threads").update(id, data);
      return thread;
    }),

  // Delete thread with cascade
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // PocketBase will handle cascade deletion of messages automatically
      await ctx.pb.collection("threads").delete(input.id);
      return { success: true };
    }),
});
