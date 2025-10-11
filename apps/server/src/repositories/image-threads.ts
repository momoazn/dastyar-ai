import { type ImageThread, prisma } from "@/database";

/**
 * Creates a new image thread with an optional title.
 * @param params - Optional parameters including title and userId.
 * @returns The ID of the created thread.
 */
export async function createImageThread(
  params?: Partial<Pick<ImageThread, "title">> & { userId: number }
): Promise<{ id: number }> {
  try {
    const title = (params?.title ?? "گفتگوی تصویری جدید").trim();

    const thread = await prisma.imageThread.create({
      data: {
        title,
        isArchived: false,
        userId: params?.userId,
      },
    });

    return { id: thread.id };
  } catch (error) {
    console.error("Failed to create image thread:", error);
    throw new Error("Unable to create image thread");
  }
}

/**
 * Retrieves a specific image thread by ID.
 * @param id - The thread ID.
 * @returns The thread record or null if not found.
 */
export async function getImageThread(id: number): Promise<ImageThread | null> {
  try {
    const thread = await prisma.imageThread.findUnique({
      where: { id },
    });

    return thread;
  } catch (error) {
    console.error(`Failed to get image thread ${id}:`, error);
    throw new Error("Unable to retrieve image thread");
  }
}

/**
 * Retrieves all image threads, optionally including archived ones.
 * @param options - Options for filtering threads.
 * @returns Array of threads.
 */
export function listImageThreads(options?: {
  includeArchived?: boolean;
}): Promise<ImageThread[]> {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.imageThread.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: [{ lastImageAt: "desc" }, { updatedAt: "desc" }],
  });
}

/**
 * Renames an image thread.
 * @param id - The thread ID.
 * @param title - The new title.
 */
export async function renameImageThread(
  id: number,
  title: string
): Promise<void> {
  try {
    await prisma.imageThread.update({
      where: { id },
      data: { title },
    });
  } catch (error) {
    console.error(`Failed to rename image thread ${id}:`, error);
    throw new Error("Unable to rename image thread");
  }
}

/**
 * Sets the archived status of an image thread.
 * @param id - The thread ID.
 * @param isArchived - Whether the thread should be archived.
 */
export async function setImageThreadArchived(
  id: number,
  isArchived: boolean
): Promise<void> {
  try {
    await prisma.imageThread.update({
      where: { id },
      data: { isArchived },
    });
  } catch (error) {
    console.error(
      `Failed to set archived status for image thread ${id}:`,
      error
    );
    throw new Error("Unable to update image thread archived status");
  }
}

/**
 * Deletes an image thread by ID.
 * @param id - The thread ID.
 */
export async function deleteImageThread(id: number): Promise<void> {
  try {
    await prisma.imageThread.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete image thread ${id}:`, error);
    throw new Error("Unable to delete image thread");
  }
}

/**
 * Updates the last image timestamp for an image thread.
 * @param threadId - The thread ID.
 * @param date - The timestamp (defaults to current time).
 */
export async function touchLastImageAt(
  threadId: number,
  date: Date = new Date()
): Promise<void> {
  try {
    await prisma.imageThread.update({
      where: { id: threadId },
      data: { lastImageAt: date },
    });
  } catch (error) {
    console.error(
      `Failed to update image thread ${threadId} on new image:`,
      error
    );
    throw new Error("Unable to update image thread timestamp");
  }
}
