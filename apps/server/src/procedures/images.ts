import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { serverTexts } from "@/lib/texts";
import { getImageThread } from "@/repositories/image-threads";
import {
  clearGeneratedImagesByThread,
  listGeneratedImagesByThread,
} from "@/repositories/images";
import {
  getSamplers,
  interrupt,
  ping,
  progress,
} from "@/services/ai-providers";
import { generateAndPersistImage } from "@/services/processors";
import { getImageUrl } from "@/services/storage";
import { protectedProcedure, publicProcedure } from "./base";

const imageGenerationParamsSchema = z.object({
  prompt: z.string().min(1, serverTexts.image.promptRequired),
  steps: z.number().int().min(1).max(150).default(20),
  cfgScale: z.number().min(1).max(30).default(7.5),
  negativePrompt: z.string().optional(),
  sampler: z.string().default("Euler a"),
  width: z.number().int().min(64).max(2048).default(512),
  height: z.number().int().min(64).max(2048).default(512),
  threadId: z.number().int().positive(serverTexts.image.threadIdRequired),
});

export type GenerateInput = z.infer<typeof imageGenerationParamsSchema>;
export type GenerationSettings = Omit<GenerateInput, "prompt" | "threadId">;

export const imageProcedures = {
  // Check if Stable Diffusion service is available
  checkService: publicProcedure.handler(async () => {
    const available = await ping();
    return { available };
  }),

  // Get available samplers from A1111
  getSamplers: publicProcedure.handler(async () => {
    try {
      const samplers = await getSamplers();
      return { samplers };
    } catch (error) {
      logger.error("Error getting samplers", error);
      throw new ORPCError("SD_SERVICE_UNAVAILABLE", {
        message: serverTexts.image.serviceUnavailable,
        status: 503,
      });
    }
  }),

  // Generate an image
  generate: protectedProcedure
    .input(imageGenerationParamsSchema)
    .handler(async ({ input, context }) =>
      generateAndPersistImage(input, context.user.id)
    ),

  // Get generation progress (for real-time updates)
  getProgress: protectedProcedure.handler(async () => {
    const generationProgress = await progress();
    if (!generationProgress) {
      return null;
    }

    const state = generationProgress.state;
    const currentStep = state?.samplingStep ?? state?.sampling_step ?? 0;
    const totalSteps = state?.samplingSteps ?? state?.sampling_steps ?? 0;
    const eta = generationProgress.eta ?? generationProgress.eta_relative ?? 0;

    return {
      progress: Math.round((generationProgress.progress ?? 0) * 100),
      eta,
      currentStep,
      totalSteps,
    };
  }),

  // Interrupt current generation
  interrupt: protectedProcedure.handler(async () => {
    const success = await interrupt();
    return { success };
  }),

  // List images by thread
  listByThread: protectedProcedure
    .input(z.object({ threadId: z.number().int().positive() }))
    .handler(async ({ input, context }) => {
      const thread = await getImageThread(input.threadId, context.user.id);
      if (!thread) {
        throw new ORPCError("NOT_FOUND", {
          message: serverTexts.chat.threadNotFound,
          status: 404,
        });
      }

      const images = await listGeneratedImagesByThread(
        input.threadId,
        context.user.id
      );

      return images.map((img) => ({
        id: img.id,
        threadId: img.threadId,
        prompt: img.prompt,
        negativePrompt: img.negativePrompt,
        url: getImageUrl(img.id),
        createdAt: img.createdAt,
        settings: img.settings as GenerationSettings,
      }));
    }),

  // Clear images by thread
  clearByThread: protectedProcedure
    .input(z.object({ threadId: z.number().int().positive() }))
    .handler(async ({ input, context }) => {
      const thread = await getImageThread(input.threadId, context.user.id);
      if (!thread) {
        throw new ORPCError("NOT_FOUND", {
          message: serverTexts.chat.threadNotFound,
          status: 404,
        });
      }

      await clearGeneratedImagesByThread(input.threadId, context.user.id);
      return { success: true };
    }),
};
