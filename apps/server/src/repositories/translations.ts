import { eq } from 'drizzle-orm';
import type { SelectTranslationOutput } from '../database/schema';
import { selectTranslationSchema, translations } from '../database/schema';
import { db } from '../database';

export function listTranslations() {
  return db.select().from(translations);
}

export async function getTranslation(id: SelectTranslationOutput['id']) {
  selectTranslationSchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(translations)
    .where(eq(translations.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteTranslation(id: SelectTranslationOutput['id']) {
  await db.delete(translations).where(eq(translations.id, id));
}