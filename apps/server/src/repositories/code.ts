import { and, desc, eq } from "drizzle-orm";
import {
  codeAssistSessions,
  codeGenerations,
  codeReviews,
  db,
  type CodeAssistSession,
  type CodeGeneration,
  type CodeReview,
} from "@/database";

export type CodeAssistSessionWithRelations = CodeAssistSession & {
  codeGenerations: CodeGeneration[];
  codeReviews: CodeReview[];
};

export async function createCodeAssistSession(
  params: Pick<CodeAssistSession, "title" | "language"> & { userId: number }
): Promise<{ id: number }> {
  try {
    const result = await db
      .insert(codeAssistSessions)
      .values({
        title: params.title.trim(),
        language: params.language,
        userId: params.userId,
      })
      .run();

    return { id: Number(result.lastInsertRowid) };
  } catch (error) {
    console.error("Failed to create code assistant session:", error);
    throw new Error("Unable to create code assistant session");
  }
}

export async function getCodeAssistSession(
  id: number,
  userId: number
): Promise<CodeAssistSessionWithRelations | null> {
  try {
    const rows = await db
      .select()
      .from(codeAssistSessions)
      .where(
        and(eq(codeAssistSessions.id, id), eq(codeAssistSessions.userId, userId))
      )
      .limit(1);

    const session = rows.at(0);
    if (!session) {
      return null;
    }

    const [generations, reviews] = await Promise.all([
      getCodeGenerations(session.id, userId),
      getCodeReviews(session.id, userId),
    ]);

    return {
      ...session,
      codeGenerations: generations,
      codeReviews: reviews,
    };
  } catch (error) {
    console.error(`Failed to get code assistant session ${id}:`, error);
    throw new Error("Unable to retrieve code assistant session");
  }
}

export function listCodeAssistSessions(
  userId: number
): Promise<CodeAssistSession[]> {
  return db
    .select()
    .from(codeAssistSessions)
    .where(eq(codeAssistSessions.userId, userId))
    .orderBy(desc(codeAssistSessions.updatedAt));
}

export async function updateCodeAssistSession(
  id: number,
  data: Partial<Pick<CodeAssistSession, "title" | "language">>,
  userId: number
): Promise<void> {
  try {
    const update: Partial<typeof codeAssistSessions.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) {
      update.title = data.title;
    }
    if (data.language !== undefined) {
      update.language = data.language;
    }

    if (Object.keys(update).length <= 1) {
      return;
    }

    await db
      .update(codeAssistSessions)
      .set(update)
      .where(
        and(eq(codeAssistSessions.id, id), eq(codeAssistSessions.userId, userId))
      )
      .run();
  } catch (error) {
    console.error(`Failed to update code assistant session ${id}:`, error);
    throw new Error("Unable to update code assistant session");
  }
}

export async function deleteCodeAssistSession(
  id: number,
  userId: number
): Promise<void> {
  try {
    await db
      .delete(codeAssistSessions)
      .where(
        and(eq(codeAssistSessions.id, id), eq(codeAssistSessions.userId, userId))
      )
      .run();
  } catch (error) {
    console.error(`Failed to delete code assistant session ${id}:`, error);
    throw new Error("Unable to delete code assistant session");
  }
}

export async function createCodeGeneration(
  params: Pick<
    CodeGeneration,
    "sessionId" | "prompt" | "generatedCode" | "language" | "modelId"
  > & { userId: number }
): Promise<{ id: number }> {
  try {
    const result = await db
      .insert(codeGenerations)
      .values({
        sessionId: params.sessionId,
        prompt: params.prompt,
        generatedCode: params.generatedCode,
        language: params.language,
        modelId: params.modelId,
        userId: params.userId,
      })
      .run();

    await db
      .update(codeAssistSessions)
      .set({ updatedAt: new Date() })
      .where(eq(codeAssistSessions.id, params.sessionId))
      .run();

    return { id: Number(result.lastInsertRowid) };
  } catch (error) {
    console.error("Failed to create code generation:", error);
    throw new Error("Unable to create code generation");
  }
}

export async function getCodeGenerations(
  sessionId: number,
  userId?: number
): Promise<CodeGeneration[]> {
  try {
    if (userId === undefined) {
      return await db
        .select()
        .from(codeGenerations)
        .where(eq(codeGenerations.sessionId, sessionId))
        .orderBy(desc(codeGenerations.createdAt));
    }

    return await db
      .select({
        id: codeGenerations.id,
        sessionId: codeGenerations.sessionId,
        prompt: codeGenerations.prompt,
        generatedCode: codeGenerations.generatedCode,
        language: codeGenerations.language,
        modelId: codeGenerations.modelId,
        createdAt: codeGenerations.createdAt,
        userId: codeGenerations.userId,
      })
      .from(codeGenerations)
      .innerJoin(
        codeAssistSessions,
        eq(codeGenerations.sessionId, codeAssistSessions.id)
      )
      .where(
        and(
          eq(codeGenerations.sessionId, sessionId),
          eq(codeAssistSessions.userId, userId)
        )
      )
      .orderBy(desc(codeGenerations.createdAt));
  } catch (error) {
    console.error(
      `Failed to get code generations for session ${sessionId}:`,
      error
    );
    throw new Error("Unable to retrieve code generations");
  }
}

export async function createCodeReview(
  params: Pick<
    CodeReview,
    | "sessionId"
    | "codeInput"
    | "reviewFeedback"
    | "suggestions"
    | "severityLevels"
    | "modelId"
  > & { userId: number }
): Promise<{ id: number }> {
  try {
    const result = await db
      .insert(codeReviews)
      .values({
        sessionId: params.sessionId,
        codeInput: params.codeInput,
        reviewFeedback: params.reviewFeedback,
        suggestions: params.suggestions,
        severityLevels: params.severityLevels,
        modelId: params.modelId,
        userId: params.userId,
      })
      .run();

    await db
      .update(codeAssistSessions)
      .set({ updatedAt: new Date() })
      .where(eq(codeAssistSessions.id, params.sessionId))
      .run();

    return { id: Number(result.lastInsertRowid) };
  } catch (error) {
    console.error("Failed to create code review:", error);
    throw new Error("Unable to create code review");
  }
}

export async function getCodeReviews(
  sessionId: number,
  userId?: number
): Promise<CodeReview[]> {
  try {
    if (userId === undefined) {
      return await db
        .select()
        .from(codeReviews)
        .where(eq(codeReviews.sessionId, sessionId))
        .orderBy(desc(codeReviews.createdAt));
    }

    return await db
      .select({
        id: codeReviews.id,
        sessionId: codeReviews.sessionId,
        codeInput: codeReviews.codeInput,
        reviewFeedback: codeReviews.reviewFeedback,
        suggestions: codeReviews.suggestions,
        severityLevels: codeReviews.severityLevels,
        modelId: codeReviews.modelId,
        createdAt: codeReviews.createdAt,
        userId: codeReviews.userId,
      })
      .from(codeReviews)
      .innerJoin(
        codeAssistSessions,
        eq(codeReviews.sessionId, codeAssistSessions.id)
      )
      .where(
        and(
          eq(codeReviews.sessionId, sessionId),
          eq(codeAssistSessions.userId, userId)
        )
      )
      .orderBy(desc(codeReviews.createdAt));
  } catch (error) {
    console.error(
      `Failed to get code reviews for session ${sessionId}:`,
      error
    );
    throw new Error("Unable to retrieve code reviews");
  }
}

export async function deleteCodeGeneration(
  id: number,
  userId?: number
): Promise<void> {
  try {
    const conditions = [eq(codeGenerations.id, id)];
    if (userId !== undefined) {
      conditions.push(eq(codeGenerations.userId, userId));
    }

    await db
      .delete(codeGenerations)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .run();
  } catch (error) {
    console.error(`Failed to delete code generation ${id}:`, error);
    throw new Error("Unable to delete code generation");
  }
}

export async function deleteCodeReview(
  id: number,
  userId?: number
): Promise<void> {
  try {
    const conditions = [eq(codeReviews.id, id)];
    if (userId !== undefined) {
      conditions.push(eq(codeReviews.userId, userId));
    }

    await db
      .delete(codeReviews)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .run();
  } catch (error) {
    console.error(`Failed to delete code review ${id}:`, error);
    throw new Error("Unable to delete code review");
  }
}
