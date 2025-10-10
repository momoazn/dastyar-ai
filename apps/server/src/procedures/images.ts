import fs from 'node:fs';
import { z } from 'zod';
import { config } from '@/config';
import {
  cleanupOrphanedFiles,
  clearGeneratedImages,
  createGeneratedImage,
  deleteGeneratedImage,
  getGeneratedImage,
  listGeneratedImages,
} from '@/repositories/images';
import {
  ALLOWED_FORMATS,
  imageStorageService,
  MAX_FILE_SIZE,
} from '@/services/image-storage';
import {
  type ImageGenerationParams,
  stableDiffusionService,
} from '@/services/stable-diffusion';
import { publicProcedure } from './base';

const imageGenerationParamsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  steps: z.number().int().min(1).max(150).default(20),
  cfg_scale: z.number().min(1).max(30).default(7.5),
  negative_prompt: z.string().optional(),
  sampler_name: z.string().default('Euler a'),
  width: z.number().int().min(64).max(2048).default(512),
  height: z.number().int().min(64).max(2048).default(512),
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
  generate: publicProcedure
    .input(imageGenerationParamsSchema)
    .handler(async ({ input }) => {
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
        });

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

  // List all generated images
  list: publicProcedure.handler(async () => {
    const images = await listGeneratedImages();
    console.log('Listing all generated images');

    return images.map((img) => ({
      id: img.id,
      prompt: img.prompt,
      imageUrl: imageStorageService.getImageUrl(img.id),
      createdAt: img.createdAt,
      settings: img.settings ? JSON.parse(img.settings) : null,
    }));
  }),

  // Get a specific image by ID
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const image = await getGeneratedImage(input.id);
      if (!image) {
        throw new Error('Image not found');
      }

      return {
        id: image.id,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
        imageUrl: imageStorageService.getImageUrl(image.id),
        createdAt: image.createdAt,
        settings: image.settings ? JSON.parse(image.settings) : null,
      };
    }),

  // Delete a specific image
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteGeneratedImage(input.id);
      return { success: true };
    }),

  // Clear all generated images
  clear: publicProcedure.handler(async () => {
    await clearGeneratedImages();
    return { success: true };
  }),

  // Get system info from A1111
  getSystemInfo: publicProcedure.handler(async () => {
    const info = await stableDiffusionService.getSystemInfo();
    return info;
  }),

  // Serve image file
  serve: publicProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const image = await getGeneratedImage(input.id);
      if (!image) {
        throw new Error('Image not found');
      }

      if (!fs.existsSync(image.filePath)) {
        throw new Error('Image file not found on disk');
      }

      // Return file buffer and metadata
      const fileBuffer = fs.readFileSync(image.filePath);

      return {
        buffer: fileBuffer,
        fileName: image.fileName,
        mimeType: 'image/png',
        size: fileBuffer.length,
      };
    }),

  // Cleanup orphaned files
  cleanup: publicProcedure.handler(async () => {
    console.log('Starting cleanup of orphaned image files...');
    const deletedCount = await cleanupOrphanedFiles();

    // Get storage stats
    const stats = imageStorageService.getFileStats();

    console.log(`Cleanup completed. Deleted ${deletedCount} orphaned files.`);

    return {
      deletedFiles: deletedCount,
      stats: {
        totalFiles: stats.totalFiles,
        totalSizeMB: Math.round((stats.totalSize / 1024 / 1024) * 100) / 100,
      },
    };
  }),

  // Get storage statistics
  getStorageStats: publicProcedure.handler(() => {
    const stats = imageStorageService.getFileStats();
    // Use environment variables directly

    return {
      totalFiles: stats.totalFiles,
      totalSizeMB: Math.round((stats.totalSize / 1024 / 1024) * 100) / 100,
      storageDir: config.images_dir,
      maxFileSizeMB: Math.round(MAX_FILE_SIZE / 1024 / 1024),
      allowedFormats: ALLOWED_FORMATS,
    };
  }),
};
