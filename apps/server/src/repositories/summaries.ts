import { prisma, type Summary } from "@/database";

/**
 * Retrieves all summaries for a user ordered by creation date (newest first).
 * @param userId - The user ID.
 * @returns Array of summaries.
 */
export function listSummaries(userId: number): Promise<Summary[]> {
  return prisma.summary.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Creates a new summary record in the database.
 * @param params - The summary parameters excluding auto-generated fields.
 * @returns The created summary record.
 */
export async function createSummary(
  params: Omit<Summary, "id" | "createdAt" | "updatedAt" | "userId"> & {
    userId: number;
  }
): Promise<Summary> {
  try {
    const summary = await prisma.summary.create({
      data: {
        sourceText: params.sourceText,
        summaryText: params.summaryText,
        modelId: params.modelId,
        mode: params.mode,
        tone: params.tone,
        userId: params.userId,
      },
    });

    return summary;
  } catch (error) {
    console.error("Failed to create summary:", error);
    throw new Error("Unable to create summary");
  }
}

/**
 * Retrieves a specific summary by ID.
 * @param id - The summary ID.
 * @param userId - The user ID.
 * @returns The summary record or null if not found.
 */
export async function getSummary(
  id: number,
  userId: number
): Promise<Summary | null> {
  try {
    const summary = await prisma.summary.findFirst({
      where: { id, userId },
    });

    return summary;
  } catch (error) {
    console.error(`Failed to get summary ${id}:`, error);
    throw new Error("Unable to retrieve summary");
  }
}

/**
 * Deletes a specific summary by ID.
 * @param id - The summary ID.
 * @param userId - The user ID.
 */
export async function deleteSummary(id: number, userId: number): Promise<void> {
  try {
    await prisma.summary.deleteMany({
      where: { id, userId },
    });
  } catch (error) {
    console.error(`Failed to delete summary ${id}:`, error);
    throw new Error("Unable to delete summary");
  }
}
