import { desc, eq } from 'drizzle-orm';
import { db } from '../database';
import type {
  InsertGeneratedImageInput,
  SelectGeneratedImageOutput,
} from '../database/schema';
import {
  generatedImagesTable,
  insertGeneratedImageSchema,
  selectGeneratedImageSchema,
} from '../database/schema';
import { imageStorageService } from '../services/image-storage';
import { generateId } from '../utils/id-generator';

export async function createGeneratedImage(
  params: Omit<InsertGeneratedImageInput, 'id'> | InsertGeneratedImageInput
) {
  const id = 'id' in params ? params.id : generateId();
  const row = insertGeneratedImageSchema.parse({ ...params, id });
  const created = await db.insert(generatedImagesTable).values(row).returning();
  return created[0];
}

export function listGeneratedImages() {
  return db
    .select()
    .from(generatedImagesTable)
    .orderBy(desc(generatedImagesTable.createdAt));
}

export async function getGeneratedImage(id: SelectGeneratedImageOutput['id']) {
  selectGeneratedImageSchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(generatedImagesTable)
    .where(eq(generatedImagesTable.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteGeneratedImage(
  id: SelectGeneratedImageOutput['id']
) {
  // First get the image to access file paths
  const image = await getGeneratedImage(id);
  if (image) {
    // Delete the files from storage
    imageStorageService.deleteImage(image.filePath);
  }

  // Delete from database
  await db.delete(generatedImagesTable).where(eq(generatedImagesTable.id, id));
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
  await db.delete(generatedImagesTable);
}

export async function getAllImageFilePaths(): Promise<string[]> {
  const images = await listGeneratedImages();
  return images.map((img) => img.filePath);
}

export async function cleanupOrphanedFiles(): Promise<number> {
  const existingPaths = await getAllImageFilePaths();
  return imageStorageService.cleanupOrphanedFiles(existingPaths);
}
