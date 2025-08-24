import { eq } from 'drizzle-orm';
import { db } from '../database';
import type { SelectTranslationOutput } from '../database/schema';
import { selectTranslationSchema, translationsTable } from '../database/schema';

export function listTranslations() {
  return db.select().from(translationsTable);
}

export async function getTranslation(id: SelectTranslationOutput['id']) {
  selectTranslationSchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(translationsTable)
    .where(eq(translationsTable.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteTranslation(id: SelectTranslationOutput['id']) {
  await db.delete(translationsTable).where(eq(translationsTable.id, id));
}
