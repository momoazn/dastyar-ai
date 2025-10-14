import { and, desc, eq } from "drizzle-orm";
import {
  db,
  summaries as summariesTable,
  type Summary,
} from "@/database";

export function listSummaries(userId: number): Promise<Summary[]> {
  return db
    .select()
    .from(summariesTable)
    .where(eq(summariesTable.userId, userId))
    .orderBy(desc(summariesTable.createdAt));
}

export async function createSummary(
  params: Omit<Summary, "id" | "createdAt" | "updatedAt"> & {
    userId: number;
  }
): Promise<Summary> {
  try {
    const result = await db
      .insert(summariesTable)
      .values({
        sourceText: params.sourceText,
        summaryText: params.summaryText,
        modelId: params.modelId,
        mode: params.mode,
        tone: params.tone,
        userId: params.userId,
      })
      .run();

    const created = await getSummary(
      Number(result.lastInsertRowid),
      params.userId
    );
    if (!created) {
      throw new Error("Unable to load summary after insert");
    }
    return created;
  } catch (error) {
    console.error("Failed to create summary:", error);
    throw new Error("Unable to create summary");
  }
}

export async function getSummary(
  id: number,
  userId: number
): Promise<Summary | null> {
  try {
    const rows = await db
      .select()
      .from(summariesTable)
      .where(and(eq(summariesTable.id, id), eq(summariesTable.userId, userId)))
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    console.error(`Failed to get summary ${id}:`, error);
    throw new Error("Unable to retrieve summary");
  }
}

export async function deleteSummary(
  id: number,
  userId: number
): Promise<void> {
  try {
    await db
      .delete(summariesTable)
      .where(and(eq(summariesTable.id, id), eq(summariesTable.userId, userId)))
      .run();
  } catch (error) {
    console.error(`Failed to delete summary ${id}:`, error);
    throw new Error("Unable to delete summary");
  }
}
