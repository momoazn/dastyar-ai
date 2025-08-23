import { desc, eq } from 'drizzle-orm';
import type {
  InsertGeneratedImageInput,
  SelectGeneratedImageOutput,
} from '../database/schema';
import {
  generatedImages,
  insertGeneratedImageSchema,
  selectGeneratedImageSchema,
} from '../database/schema';
import { db } from '../database';
import { generateId } from '../utils/id-generator';

export async function createGeneratedImage(
  params: Omit<InsertGeneratedImageInput, 'id'>
) {
  const id = generateId();
  const row = insertGeneratedImageSchema.parse({ id, ...params });
  const created = await db.insert(generatedImages).values(row).returning();
  return created[0];
}

export function listGeneratedImages() {
  return db
    .select()
    .from(generatedImages)
    .orderBy(desc(generatedImages.createdAt));
}

export async function getGeneratedImage(id: SelectGeneratedImageOutput['id']) {
  selectGeneratedImageSchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(generatedImages)
    .where(eq(generatedImages.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteGeneratedImage(
  id: SelectGeneratedImageOutput['id']
) {
  await db.delete(generatedImages).where(eq(generatedImages.id, id));
}

export async function clearGeneratedImages() {
  await db.delete(generatedImages);
}