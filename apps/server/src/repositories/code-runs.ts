import { and, desc, eq } from "drizzle-orm";
import { type CodeRun, codeRuns, db } from "@/database";

export async function createCodeRun(params: {
  mode: string;
  language: string;
  inputText: string;
  errorText?: string | null;
  output: string; // JSON stringified
  modelId: number;
  userId: number;
}): Promise<{ id: number }> {
  const res = await db
    .insert(codeRuns)
    .values({
      mode: params.mode,
      language: params.language,
      inputText: params.inputText,
      errorText: params.errorText ?? null,
      output: params.output,
      modelId: params.modelId,
      userId: params.userId,
    })
    .returning();
  return { id: Number(res.at(0)?.id) };
}

export async function getCodeRun(
  id: number,
  userId: number
): Promise<CodeRun | null> {
  const rows = await db
    .select()
    .from(codeRuns)
    .where(and(eq(codeRuns.id, id), eq(codeRuns.userId, userId)))
    .limit(1);
  return rows.at(0) ?? null;
}

export function listCodeRuns(userId: number, limit = 20): Promise<CodeRun[]> {
  return db
    .select()
    .from(codeRuns)
    .where(eq(codeRuns.userId, userId))
    .orderBy(desc(codeRuns.createdAt))
    .limit(limit);
}

export async function deleteCodeRun(id: number, userId: number): Promise<void> {
  await db
    .delete(codeRuns)
    .where(and(eq(codeRuns.id, id), eq(codeRuns.userId, userId)))
    .run();
}
