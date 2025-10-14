import { z } from "zod";
import {
  clearGeneratedImagesByThread,
  listGeneratedImagesByThread,
} from "@/repositories/images";
import { getImageUrl } from "@/services/image-storage";
import { generateAndPersistImage } from "@/services/images";
import {
  getSamplers,
  interrupt,
  ping,
  progress,
} from "@/services/stable-diffusion";
import { protectedProcedure, publicProcedure } from "./base";

const imageGenerationParamsSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  steps: z.number().int().min(1).max(150).default(20),
  cfgScale: z.number().min(1).max(30).default(7.5),
  negativePrompt: z.string().optional(),
  sampler: z.string().default("Euler a"),
  width: z.number().int().min(64).max(2048).default(512),
  height: z.number().int().min(64).max(2048).default(512),
  threadId: z.number().int().positive("Thread ID is required"),
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
    const samplers = await getSamplers();
    return { samplers };
  }),

  // Generate an image
  generate: protectedProcedure
    .input(imageGenerationParamsSchema)
    .handler(async ({ input, context }) =>
      generateAndPersistImage(input, context.user?.id)
    ),

  // Get generation progress (for real-time updates)
  getProgress: publicProcedure.handler(async () => {
    const generationProgress = await progress();
    return generationProgress
      ? {
          progress: Math.round(generationProgress.progress * 100),
          eta: generationProgress.eta,
          currentStep: generationProgress.state?.samplingStep || 0,
          totalSteps: generationProgress.state?.samplingSteps || 0,
        }
      : null;
  }),

  // Interrupt current generation
  interrupt: publicProcedure.handler(async () => {
    const success = await interrupt();
    return { success };
  }),

  // List images by thread
  listByThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      const images = await listGeneratedImagesByThread(
        input.threadId,
        context.user?.id
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
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      await clearGeneratedImagesByThread(input.threadId, context.user?.id);
      return { success: true };
    }),
};
