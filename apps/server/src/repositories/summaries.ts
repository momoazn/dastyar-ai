import { and, desc, eq } from "drizzle-orm";
import { db, type Summary, summaries as summariesTable } from "@/database";
import { logger } from "@/lib/logger";

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
      .returning();

    const created = await getSummary(Number(result.at(0)?.id), params.userId);
    if (!created) {
      throw new Error("بارگذاری خلاصه پس از ثبت ناموفق بود.");
    }
    return created;
  } catch (error) {
    logger.error("Failed to create summary", error);
    throw new Error("ایجاد خلاصه ناموفق بود.");
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
    logger.error("Failed to get summary", error, { id });
    throw new Error("دریافت خلاصه ناموفق بود.");
  }
}

export async function deleteSummary(id: number, userId: number): Promise<void> {
  try {
    await db
      .delete(summariesTable)
      .where(and(eq(summariesTable.id, id), eq(summariesTable.userId, userId)))
      .run();
  } catch (error) {
    logger.error("Failed to delete summary", error, { id });
    throw new Error("حذف خلاصه ناموفق بود.");
  }
}
