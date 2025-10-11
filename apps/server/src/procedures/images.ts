import { z } from 'zod';
import { touchLastImageAt } from '@/repositories/image-threads';
import {
  clearGeneratedImagesByThread,
  createGeneratedImage,
  listGeneratedImagesByThread,
} from '@/repositories/images';
import { imageStorageService } from '@/services/image-storage';
import {
  type ImageGenerationParams,
  stableDiffusionService,
} from '@/services/stable-diffusion';
import { protectedProcedure, publicProcedure } from './base';

const imageGenerationParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  steps: z.number().int().min(1).max(150).default(20),
  cfg_scale: z.number().min(1).max(30).default(7.5),
  negative_prompt: z.string().optional(),
  sampler_name: z.string().default('Euler a'),
  width: z.number().int().min(64).max(2048).default(512),
  height: z.number().int().min(64).max(2048).default(512),
  threadId: z.number().int().positive('Thread ID is required'),
});

export const imageProcedures = {
  // Check if Stable Diffusion service is available
  checkService: publicProcedure.handler(async () => {
    const isAvailable = await stableDiffusionService.checkAvailability();
    return { available: isAvailable };
  }),

  // Get available samplers from A1111
  getSamplers: publicProcedure.handler(async () => {
    const samplers = await stableDiffusionService.getSamplers();
    return { samplers };
  }),

  // Generate an image
  generate: protectedProcedure
    .input(imageGenerationParamsSchema)
    .handler(async ({ input, context }) => {
      console.log(
        'Starting image generation with prompt:',
        input.prompt.substring(0, 100)
      );

      // Check service availability first
      const isAvailable = await stableDiffusionService.checkAvailability();
      if (!isAvailable) {
        throw new Error(
          'Stable Diffusion service is not available. Please ensure A1111 is running on port 7860.'
        );
      }

      try {
        // Generate the image
        const base64Image = await stableDiffusionService.generateImage(
          input as ImageGenerationParams
        );

        // Save image to file system first
        const storageResult = imageStorageService.saveImage(base64Image, {
          id: 'temp', // Temporary ID, will be updated after database creation
          prompt: input.prompt,
          negativePrompt: input.negative_prompt,
          settings: {
            steps: input.steps,
            cfg_scale: input.cfg_scale,
            sampler_name: input.sampler_name,
            width: input.width,
            height: input.height,
          },
        });

        // Save metadata to database
        const savedImage = await createGeneratedImage({
          prompt: input.prompt,
          negativePrompt: input.negative_prompt || null,
          filePath: storageResult.filePath,
          fileName: storageResult.fileName,
          settings: JSON.stringify({
            steps: input.steps,
            cfg_scale: input.cfg_scale,
            sampler_name: input.sampler_name,
            width: input.width,
            height: input.height,
          }),
          threadId: input.threadId,
          userId: context.user!.id,
        });

        // Update thread's last image timestamp
        await touchLastImageAt(input.threadId);

        console.log('Image generated and saved with ID:', savedImage.id);

        return {
          id: savedImage.id,
          imageUrl: imageStorageService.getImageUrl(savedImage.id),
          prompt: savedImage.prompt,
          createdAt: savedImage.createdAt,
        };
      } catch (error) {
        console.error('Image generation failed:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown error during image generation';
        throw new Error(`Image generation failed: ${errorMessage}`);
      }
    }),

  // Get generation progress (for real-time updates)
  getProgress: publicProcedure.handler(async () => {
    const progress = await stableDiffusionService.getProgress();
    return progress
      ? {
          progress: Math.round(progress.progress * 100),
          eta: progress.eta_relative,
          currentStep: progress.state?.sampling_step || 0,
          totalSteps: progress.state?.sampling_steps || 0,
        }
      : null;
  }),

  // Interrupt current generation
  interrupt: publicProcedure.handler(async () => {
    const success = await stableDiffusionService.interrupt();
    return { success };
  }),

  // List images by thread
  listByThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      const images = await listGeneratedImagesByThread(
        input.threadId,
        context.user!.id
      );
      console.log(`Listing images for thread ${input.threadId}`);

      return images.map((img) => ({
        id: img.id,
        threadId: img.threadId,
        prompt: img.prompt,
        negativePrompt: img.negativePrompt,
        imageUrl: imageStorageService.getImageUrl(img.id),
        createdAt: img.createdAt,
        settings: img.settings ? JSON.parse(img.settings) : null,
      }));
    }),

  // Clear images by thread
  clearByThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) => {
      await clearGeneratedImagesByThread(input.threadId, context.user!.id);
      return { success: true };
    }),

  // Get system info from A1111
  getSystemInfo: publicProcedure.handler(async () => {
    const info = await stableDiffusionService.getSystemInfo();
    return info;
  }),
};
