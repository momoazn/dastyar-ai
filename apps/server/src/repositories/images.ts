import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  generatedImages as generatedImagesTable,
  type GeneratedImage,
  type JsonValue,
} from "@/database";
import {
  cleanupOrphanedFiles as storageCleanupOrphanedFiles,
  deleteImage as deleteImageFile,
} from "@/services/image-storage";

export async function createGeneratedImage(
  params: Omit<GeneratedImage, "id" | "createdAt" | "updatedAt" | "settings"> & {
    settings: JsonValue;
  }
): Promise<GeneratedImage> {
  const result = await db
    .insert(generatedImagesTable)
    .values({
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      filePath: params.filePath,
      fileName: params.fileName,
      settings: params.settings,
      threadId: params.threadId,
      userId: params.userId,
    })
    .run();

  const created = await getGeneratedImage(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error("Unable to load generated image after insert");
  }
  return created;
}

export function listGeneratedImages(): Promise<GeneratedImage[]> {
  return db
    .select()
    .from(generatedImagesTable)
    .orderBy(desc(generatedImagesTable.createdAt));
}

export async function getGeneratedImage(
  id: number
): Promise<GeneratedImage | null> {
  const rows = await db
    .select()
    .from(generatedImagesTable)
    .where(eq(generatedImagesTable.id, id))
    .limit(1);
  return rows.at(0) ?? null;
}

export async function getGeneratedImageByUser(
  id: number,
  userId: number
): Promise<GeneratedImage | null> {
  const rows = await db
    .select()
    .from(generatedImagesTable)
    .where(
      and(
        eq(generatedImagesTable.id, id),
        eq(generatedImagesTable.userId, userId)
      )
    )
    .limit(1);
  return rows.at(0) ?? null;
}

export async function deleteGeneratedImage(id: number): Promise<void> {
  const image = await getGeneratedImage(id);
  if (!image) {
    throw new Error(`Generated image with id ${id} not found`);
  }

  await deleteImageFile(image.filePath);
  await db
    .delete(generatedImagesTable)
    .where(eq(generatedImagesTable.id, id))
    .run();
}

export async function clearGeneratedImages(): Promise<void> {
  const allImages = await listGeneratedImages();
  const deletePromises = allImages.map((image) =>
    deleteImageFile(image.filePath)
  );
  await Promise.allSettled(deletePromises);

  await db.delete(generatedImagesTable).run();
}

export async function getAllImageFilePaths(): Promise<string[]> {
  const images = await listGeneratedImages();
  return images.map((img) => img.filePath);
}

export async function cleanupOrphanedFiles(): Promise<number> {
  const existingPaths = await getAllImageFilePaths();
  return await storageCleanupOrphanedFiles(existingPaths);
}

export function listGeneratedImagesByThread(
  threadId: number,
  userId: number
): Promise<GeneratedImage[]> {
  return db
    .select()
    .from(generatedImagesTable)
    .where(
      and(
        eq(generatedImagesTable.threadId, threadId),
        eq(generatedImagesTable.userId, userId)
      )
    )
    .orderBy(asc(generatedImagesTable.createdAt));
}

export async function clearGeneratedImagesByThread(
  threadId: number,
  userId: number
): Promise<void> {
  const threadImages = await listGeneratedImagesByThread(threadId, userId);
  const deletePromises = threadImages.map((image) =>
    deleteImageFile(image.filePath)
  );
  await Promise.allSettled(deletePromises);

  await db
    .delete(generatedImagesTable)
    .where(
      and(
        eq(generatedImagesTable.threadId, threadId),
        eq(generatedImagesTable.userId, userId)
      )
    )
    .run();
}
