import { desc, eq } from 'drizzle-orm';
import { db } from '../database';
import type { SelectSummaryOutput } from '../database/schema';
import { selectSummarySchema, summariesTable } from '../database/schema';

export function listSummaries() {
  return db
    .select()
    .from(summariesTable)
    .orderBy(desc(summariesTable.createdAt));
}

export async function getSummary(id: SelectSummaryOutput['id']) {
  selectSummarySchema.shape.id.parse(id);
  const rows = await db
    .select()
    .from(summariesTable)
    .where(eq(summariesTable.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function deleteSummary(id: SelectSummaryOutput['id']) {
  await db.delete(summariesTable).where(eq(summariesTable.id, id));
}
