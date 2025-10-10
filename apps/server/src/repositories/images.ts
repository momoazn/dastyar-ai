import { type GeneratedImage, prisma } from '@/database';
import { imageStorageService } from '@/services/image-storage';

/**
 * Creates a new generated image record in the database.
 * @param params - The image parameters excluding auto-generated fields.
 * @returns The created image record.
 */
export async function createGeneratedImage(
  params: Omit<GeneratedImage, 'id' | 'createdAt' | 'updatedAt'>
): Promise<GeneratedImage> {
  try {
    const image = await prisma.generatedImage.create({
      data: {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        filePath: params.filePath,
        fileName: params.fileName,
        settings: params.settings,
        imageThreadId: params.imageThreadId,
      },
    });

    return image;
  } catch (error) {
    console.error('Failed to create generated image:', error);
    throw new Error('Unable to create generated image');
  }
}

/**
 * Retrieves all generated images ordered by creation date (newest first).
 * @returns Array of generated images.
 */
export function listGeneratedImages(): Promise<GeneratedImage[]> {
  return prisma.generatedImage.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Retrieves a specific generated image by ID.
 * @param id - The image ID.
 * @returns The image record or null if not found.
 */
export async function getGeneratedImage(
  id: number
): Promise<GeneratedImage | null> {
  try {
    const image = await prisma.generatedImage.findUnique({
      where: { id },
    });

    return image;
  } catch (error) {
    console.error(`Failed to get generated image ${id}:`, error);
    throw new Error('Unable to retrieve generated image');
  }
}

/**
 * Deletes a generated image and its associated files.
 * @param id - The image ID.
 * @throws Error if the image is not found or deletion fails.
 */
export async function deleteGeneratedImage(id: number): Promise<void> {
  try {
    // First get the image to access file paths
    const image = await getGeneratedImage(id);
    if (!image) {
      throw new Error(`Generated image with id ${id} not found`);
    }

    // Delete the files from storage
    await imageStorageService.deleteImage(image.filePath);

    // Delete from database
    await prisma.generatedImage.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete generated image ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes all generated images and their associated files.
 */
export async function clearGeneratedImages(): Promise<void> {
  try {
    // First get all images to delete their files
    const allImages = await listGeneratedImages();

    // Delete all files from storage
    const deletePromises = allImages.map(async (image) => {
      try {
        await imageStorageService.deleteImage(image.filePath);
      } catch (error) {
        console.error(`Failed to delete files for image ${image.id}:`, error);
      }
    });

    await Promise.all(deletePromises);

    // Delete all records from database
    await prisma.generatedImage.deleteMany();
  } catch (error) {
    console.error('Failed to clear generated images:', error);
    throw new Error('Unable to clear generated images');
  }
}

/**
 * Retrieves all file paths of generated images.
 * @returns Array of file paths.
 */
export async function getAllImageFilePaths(): Promise<string[]> {
  try {
    const images = await listGeneratedImages();
    return images.map((img) => img.filePath);
  } catch (error) {
    console.error('Failed to get all image file paths:', error);
    throw new Error('Unable to retrieve image file paths');
  }
}

/**
 * Cleans up orphaned image files not associated with any database records.
 * @returns The number of files cleaned up.
 */
export async function cleanupOrphanedFiles(): Promise<number> {
  try {
    const existingPaths = await getAllImageFilePaths();
    return await imageStorageService.cleanupOrphanedFiles(existingPaths);
  } catch (error) {
    console.error('Failed to cleanup orphaned files:', error);
    throw new Error('Unable to cleanup orphaned files');
  }
}

/**
 * Retrieves all generated images for a specific thread ordered by creation date (newest first).
 * @param threadId - The thread ID.
 * @returns Array of generated images.
 */
export function listGeneratedImagesByThread(
  threadId: number
): Promise<GeneratedImage[]> {
  return prisma.generatedImage.findMany({
    where: { imageThreadId: threadId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Deletes all generated images for a specific thread and their associated files.
 * @param threadId - The thread ID.
 */
export async function clearGeneratedImagesByThread(
  threadId: number
): Promise<void> {
  try {
    // First get all images for this thread to delete their files
    const threadImages = await listGeneratedImagesByThread(threadId);

    // Delete all files from storage
    const deletePromises = threadImages.map(async (image) => {
      try {
        await imageStorageService.deleteImage(image.filePath);
      } catch (error) {
        console.error(`Failed to delete files for image ${image.id}:`, error);
      }
    });

    await Promise.all(deletePromises);

    // Delete all records from database
    await prisma.generatedImage.deleteMany({
      where: { imageThreadId: threadId },
    });
  } catch (error) {
    console.error(
      `Failed to clear generated images for thread ${threadId}:`,
      error
    );
    throw new Error('Unable to clear generated images for thread');
  }
}
