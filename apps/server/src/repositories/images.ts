import { type GeneratedImage, type Prisma, prisma } from "@/database";
import {
  deleteImage as deleteImageFile,
  cleanupOrphanedFiles as storageCleanupOrphanedFiles,
} from "@/services/image-storage";

/**
 * Creates a new generated image record in the database.
 * @param params - The image parameters excluding auto-generated fields.
 * @returns The created image record.
 */
export function createGeneratedImage(
  params: Omit<GeneratedImage, "id" | "createdAt" | "updatedAt" | "userId"> & {
    userId: number;
  }
): Promise<GeneratedImage> {
  return prisma.generatedImage.create({
    data: {
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      filePath: params.filePath,
      fileName: params.fileName,
      settings: params.settings as Prisma.InputJsonValue,
      threadId: params.threadId,
      userId: params.userId,
    },
  });
}

/**
 * Retrieves all generated images ordered by creation date (newest first).
 * @returns Array of generated images.
 */
export function listGeneratedImages(): Promise<GeneratedImage[]> {
  return prisma.generatedImage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retrieves a specific generated image by ID.
 * @param id - The image ID.
 * @returns The image record or null if not found.
 */
export function getGeneratedImage(id: number): Promise<GeneratedImage | null> {
  return prisma.generatedImage.findUnique({
    where: { id },
  });
}

/**
 * Gets a generated image by ID with user ownership verification
 * @param id - The image ID
 * @param userId - The user ID to verify ownership
 * @returns The image if found and owned by the user, null otherwise
 */
export function getGeneratedImageByUser(
  id: number,
  userId: number
): Promise<GeneratedImage | null> {
  return prisma.generatedImage.findFirst({
    where: {
      id,
      userId,
    },
  });
}

/**
 * Deletes a generated image and its associated files.
 * @param id - The image ID.
 * @throws Error if the image is not found or deletion fails.
 */
export async function deleteGeneratedImage(id: number): Promise<void> {
  // First get the image to access file paths
  const image = await getGeneratedImage(id);
  if (!image) {
    throw new Error(`Generated image with id ${id} not found`);
  }

  // Delete the files from storage
  await deleteImageFile(image.filePath);

  // Delete from database
  await prisma.generatedImage.delete({
    where: { id },
  });
}

/**
 * Deletes all generated images and their associated files.
 */
export async function clearGeneratedImages(): Promise<void> {
  // First get all images to delete their files
  const allImages = await listGeneratedImages();

  // Delete all files from storage
  const deletePromises = allImages.map((image) =>
    deleteImageFile(image.filePath)
  );

  await Promise.allSettled(deletePromises);

  // Delete all records from database
  await prisma.generatedImage.deleteMany();
}

/**
 * Retrieves all file paths of generated images.
 * @returns Array of file paths.
 */
export async function getAllImageFilePaths(): Promise<string[]> {
  const images = await listGeneratedImages();
  return images.map((img) => img.filePath);
}

/**
 * Cleans up orphaned image files not associated with any database records.
 * @returns The number of files cleaned up.
 */
export async function cleanupOrphanedFiles(): Promise<number> {
  const existingPaths = await getAllImageFilePaths();
  return await storageCleanupOrphanedFiles(existingPaths);
}

/**
 * Retrieves all generated images for a specific thread ordered by creation date (newest first).
 * @param threadId - The thread ID.
 * @param userId - The user ID.
 * @returns Array of generated images.
 */
export function listGeneratedImagesByThread(
  threadId: number,
  userId: number
): Promise<GeneratedImage[]> {
  return prisma.generatedImage.findMany({
    where: { threadId, userId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Deletes all generated images for a specific thread and their associated files.
 * @param threadId - The thread ID.
 * @param userId - The user ID.
 */
export async function clearGeneratedImagesByThread(
  threadId: number,
  userId: number
): Promise<void> {
  // First get all images for this thread to delete their files
  const threadImages = await listGeneratedImagesByThread(threadId, userId);

  // Delete all files from storage
  const deletePromises = threadImages.map((image) =>
    deleteImageFile(image.filePath)
  );

  await Promise.allSettled(deletePromises);

  // Delete all records from database
  await prisma.generatedImage.deleteMany({
    where: { threadId, userId },
  });
}
