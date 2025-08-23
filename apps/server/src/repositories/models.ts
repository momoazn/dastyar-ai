import { eq } from 'drizzle-orm';
import type { SelectModelOutput } from '../database/schema';
import { models, selectModelSchema } from '../database/schema';
import { db } from '../database';

export async function getModelById(id: SelectModelOutput['id']) {
  // Validate using schema id
  selectModelSchema.shape.id.parse(id);
  const rows = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return rows[0] || null;
}

export async function getModelByName(name: SelectModelOutput['name']) {
  // Validate using schema name
  selectModelSchema.shape.name.parse(name);
  const rows = await db
    .select()
    .from(models)
    .where(eq(models.name, name))
    .limit(1);
  return rows[0] || null;
}