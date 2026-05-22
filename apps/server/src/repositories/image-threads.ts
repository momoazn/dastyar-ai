import { and, desc, eq } from "drizzle-orm";
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

export async function getImageThread(
  id: number,
  userId: number
): Promise<ImageThread | null> {
  try {
    const rows = await db
      .select()
      .from(imageThreads)
      .where(and(eq(imageThreads.id, id), eq(imageThreads.userId, userId)))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    logger.error("Failed to get image thread", error, { id, userId });
    throw new Error("Unable to retrieve image thread");
  }
}

export function listImageThreads(options: {
  includeArchived?: boolean;
  userId: number;
}): Promise<ImageThread[]> {
  const includeArchived = options.includeArchived ?? false;
  const conditions = [eq(imageThreads.userId, options.userId)];

  if (!includeArchived) {
    conditions.push(eq(imageThreads.isArchived, false));
  }

  if (conditions.length === 1) {
    return db
      .select()
      .from(imageThreads)
      .where(conditions[0])
      .orderBy(desc(imageThreads.lastImageAt), desc(imageThreads.updatedAt));
  }

  return db
    .select()
    .from(imageThreads)
    .where(and(...conditions))
    .orderBy(desc(imageThreads.lastImageAt), desc(imageThreads.updatedAt));
}

export async function renameImageThread(
  id: number,
  title: string,
  userId: number
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(and(eq(imageThreads.id, id), eq(imageThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to rename image thread", error, { id, userId });
    throw new Error("Unable to rename image thread");
  }
}

export async function setImageThreadArchived(
  id: number,
  isArchived: boolean,
  userId: number
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        isArchived,
        updatedAt: new Date(),
      })
      .where(and(eq(imageThreads.id, id), eq(imageThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to set archived status for image thread", error, {
      id,
      userId,
    });
    throw new Error("Unable to update image thread archived status");
  }
}

export async function deleteImageThread(
  id: number,
  userId: number
): Promise<void> {
  try {
    await db
      .delete(imageThreads)
      .where(and(eq(imageThreads.id, id), eq(imageThreads.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to delete image thread", error, { id, userId });
    throw new Error("Unable to delete image thread");
  }
}

export async function touchLastImageAt(
  threadId: number,
  userId: number,
  date: Date = new Date()
): Promise<void> {
  try {
    await db
      .update(imageThreads)
      .set({
        lastImageAt: date,
        updatedAt: date,
      })
      .where(
        and(eq(imageThreads.id, threadId), eq(imageThreads.userId, userId))
      )
      .run();
  } catch (error) {
    logger.error("Failed to update image thread on new image", error, {
      threadId,
      userId,
    });
    throw new Error("Unable to update image thread timestamp");
  }
}
