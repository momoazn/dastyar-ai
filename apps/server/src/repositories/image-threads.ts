import { desc, eq } from "drizzle-orm";
import { db, type ImageThread, imageThreads } from "@/database";
import { logger } from "@/lib/logger";

export async function createImageThread(
  params: Partial<Pick<ImageThread, "title">> & { userId: number }
): Promise<{ id: number }> {
  try {
    const title = (params.title ?? "گفتگوی تصویری جدید").trim();

    const result = await db
      .insert(imageThreads)
      .values({
        title,
        isArchived: false,
        userId: params.userId,
      })
      .returning();

    return { id: Number(result.at(0)?.id) };
  } catch (error) {
    logger.error("Failed to create image thread", error);
    throw new Error("Unable to create image thread");
  }
}

export async function getImageThread(id: number): Promise<ImageThread | null> {
  try {
    const rows = await db
      .select()
      .from(imageThreads)
      .where(eq(imageThreads.id, id))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    logger.error("Failed to get image thread", error, { id });
    throw new Error("Unable to retrieve image thread");
  }
}

export function listImageThreads(options?: {
  includeArchived?: boolean;
}): Promise<ImageThread[]> {
  const includeArchived = options?.includeArchived ?? false;
  if (includeArchived) {
    return db
      .select()
      .from(imageThreads)
      .orderBy(desc(imageThreads.lastImageAt), desc(imageThreads.updatedAt));
  }
  return db
    .select()
    .from(imageThreads)
    .where(eq(imageThreads.isArchived, false))
    .orderBy(desc(imageThreads.lastImageAt), desc(imageThreads.updatedAt));
}

export async function renameImageThread(
  id: number,
  title: string
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(imageThreads.id, id))
      .run();
  } catch (error) {
    logger.error("Failed to rename image thread", error, { id });
    throw new Error("Unable to rename image thread");
  }
}

export async function setImageThreadArchived(
  id: number,
  isArchived: boolean
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        isArchived,
        updatedAt: new Date(),
      })
      .where(eq(imageThreads.id, id))
      .run();
  } catch (error) {
    logger.error("Failed to set archived status for image thread", error, {
      id,
    });
    throw new Error("Unable to update image thread archived status");
  }
}

export async function deleteImageThread(id: number): Promise<void> {
  try {
    await db.delete(imageThreads).where(eq(imageThreads.id, id)).run();
  } catch (error) {
    logger.error("Failed to delete image thread", error, { id });
    throw new Error("Unable to delete image thread");
  }
}

export async function touchLastImageAt(
  threadId: number,
  date: Date = new Date()
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        lastImageAt: date,
        updatedAt: date,
      })
      .where(eq(imageThreads.id, threadId))
      .run();
  } catch (error) {
    logger.error("Failed to update image thread on new image", error, {
      threadId,
    });
    throw new Error("Unable to update image thread timestamp");
  }
}
