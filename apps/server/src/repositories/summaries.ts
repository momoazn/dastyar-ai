import { prisma, type Summary } from '@/database';

/**
 * Retrieves all summaries ordered by creation date (newest first).
 * @returns Array of summaries.
 */
export function listSummaries(): Promise<Summary[]> {
  return prisma.summary.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Creates a new summary record in the database.
 * @param params - The summary parameters excluding auto-generated fields.
 * @returns The created summary record.
 */
export async function createSummary(
  params: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Summary> {
  try {
    const summary = await prisma.summary.create({
      data: {
        sourceText: params.sourceText,
        summaryText: params.summaryText,
        modelName: params.modelName,
        mode: params.mode,
        tone: params.tone,
      },
    });

    return summary;
  } catch (error) {
    console.error('Failed to create summary:', error);
    throw new Error('Unable to create summary');
  }
}

/**
 * Retrieves a specific summary by ID.
 * @param id - The summary ID.
 * @returns The summary record or null if not found.
 */
export async function getSummary(id: number): Promise<Summary | null> {
  try {
    const summary = await prisma.summary.findUnique({
      where: { id },
    });

    return summary;
  } catch (error) {
    console.error(`Failed to get summary ${id}:`, error);
    throw new Error('Unable to retrieve summary');
  }
}

/**
 * Deletes a specific summary by ID.
 * @param id - The summary ID.
 */
export async function deleteSummary(id: number): Promise<void> {
  try {
    await prisma.summary.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete summary ${id}:`, error);
    throw new Error('Unable to delete summary');
  }
}
