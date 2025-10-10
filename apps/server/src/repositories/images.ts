import type { GeneratedImage } from '@prisma/client';
import prisma from '@/database';
import { imageStorageService } from '@/services/image-storage';

export async function createGeneratedImage(
  params: Omit<GeneratedImage, 'id' | 'createdAt' | 'updatedAt'>
) {
  const image = await prisma.generatedImage.create({
    data: {
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      filePath: params.filePath,
      fileName: params.fileName,
      settings: params.settings,
    },
  });

  return image;
}

export function listGeneratedImages() {
  return prisma.generatedImage.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGeneratedImage(id: number) {
  const image = await prisma.generatedImage.findUnique({
    where: { id },
  });

  return image;
}

export async function deleteGeneratedImage(id: number) {
  // First get the image to access file paths
  const image = await getGeneratedImage(id);
  if (image) {
    // Delete the files from storage
    imageStorageService.deleteImage(image.filePath);
  }

  // Delete from database
  await prisma.generatedImage.delete({
    where: { id },
  });
}

export async function clearGeneratedImages() {
  // First get all images to delete their files
  const allImages = await listGeneratedImages();

  // Delete all files from storage
  for (const image of allImages) {
    try {
      imageStorageService.deleteImage(image.filePath);
    } catch (error) {
      console.error(`Failed to delete files for image ${image.id}:`, error);
    }
  }

  // Delete all records from database
  await prisma.generatedImage.deleteMany();
}

export async function getAllImageFilePaths(): Promise<string[]> {
  const images = await listGeneratedImages();
  return images.map((img) => img.filePath);
}

export async function cleanupOrphanedFiles(): Promise<number> {
  const existingPaths = await getAllImageFilePaths();
  return imageStorageService.cleanupOrphanedFiles(existingPaths);
}
