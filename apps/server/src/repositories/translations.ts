import { and, eq } from "drizzle-orm";
import {
  db,
  type Translation,
  type TranslationPayload,
  translations as translationsTable,
} from "@/database";
import { logger } from "@/lib/logger";

type CreateTranslationParams = {
  sourceText: string;
  translatedText: string | null;
  modelId: Translation["modelId"];
  sourceLanguage: Translation["sourceLanguage"];
  targetLanguage: Translation["targetLanguage"];
  tone?: Translation["tone"];
  userId: number;
  sourceType?: Translation["sourceType"];
  sourceFileName?: Translation["sourceFileName"];
  payload?: TranslationPayload | null;
};

export function listTranslations(userId: number): Promise<Translation[]> {
  return db
    .select()
    .from(translationsTable)
    .where(eq(translationsTable.userId, userId));
}

export async function createTranslation(
  params: CreateTranslationParams
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
        tone: params.tone ?? null,
        sourceType: params.sourceType ?? "text",
        sourceFileName: params.sourceFileName ?? null,
        payload: params.payload ?? null,
        userId: params.userId,
      })
      .returning();

    const created = await getTranslation(
      Number(result.at(0)?.id),
      params.userId
    );
    if (!created) {
      throw new Error("بارگذاری ترجمه پس از ثبت ناموفق بود.");
    }
    return created;
  } catch (error) {
    logger.error("Failed to create translation", error);
    throw new Error("ایجاد ترجمه ناموفق بود.");
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
    logger.error("Failed to get translation", error, { id });
    throw new Error("دریافت ترجمه ناموفق بود.");
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
    logger.error("Failed to delete translation", error, { id });
    throw new Error("حذف ترجمه ناموفق بود.");
  }
}
