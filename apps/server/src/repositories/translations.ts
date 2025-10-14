import { and, eq } from "drizzle-orm";
import {
  db,
  translations as translationsTable,
  type Translation,
} from "@/database";

export function listTranslations(userId: number): Promise<Translation[]> {
  return db
    .select()
    .from(translationsTable)
    .where(eq(translationsTable.userId, userId));
}

export async function createTranslation(
  params: Omit<Translation, "id" | "createdAt" | "updatedAt"> & {
    userId: number;
  }
): Promise<Translation> {
  try {
    const result = await db
      .insert(translationsTable)
      .values({
        sourceText: params.sourceText,
        translatedText: params.translatedText,
        modelId: params.modelId,
        sourceLanguage: params.sourceLanguage,
        targetLanguage: params.targetLanguage,
        tone: params.tone,
        userId: params.userId,
      })
      .run();

    const created = await getTranslation(
      Number(result.lastInsertRowid),
      params.userId
    );
    if (!created) {
      throw new Error("Unable to load translation after insert");
    }
    return created;
  } catch (error) {
    console.error("Failed to create translation:", error);
    throw new Error("Unable to create translation");
  }
}

export async function getTranslation(
  id: number,
  userId: number
): Promise<Translation | null> {
  try {
    const rows = await db
      .select()
      .from(translationsTable)
      .where(
        and(eq(translationsTable.id, id), eq(translationsTable.userId, userId))
      )
      .limit(1);

    return rows.at(0) ?? null;
  } catch (error) {
    console.error(`Failed to get translation ${id}:`, error);
    throw new Error("Unable to retrieve translation");
  }
}

export async function deleteTranslation(
  id: number,
  userId: number
): Promise<void> {
  try {
    await db
      .delete(translationsTable)
      .where(
        and(eq(translationsTable.id, id), eq(translationsTable.userId, userId))
      )
      .run();
  } catch (error) {
    console.error(`Failed to delete translation ${id}:`, error);
    throw new Error("Unable to delete translation");
  }
}
