import {
  type CodeAssistSession,
  type CodeGeneration,
  type CodeReview,
  prisma,
} from '@/database';

/**
 * Creates a new code assistant session.
 * @param params - Parameters including title and language.
 * @returns The ID of the created session.
 */
export async function createCodeAssistSession(
  params: Pick<CodeAssistSession, 'title' | 'language'>
): Promise<{ id: number }> {
  try {
    const session = await prisma.codeAssistSession.create({
      data: {
        title: params.title.trim(),
        language: params.language,
      },
    });

    return { id: session.id };
  } catch (error) {
    console.error('Failed to create code assistant session:', error);
    throw new Error('Unable to create code assistant session');
  }
}

/**
 * Retrieves a specific code assistant session by ID.
 * @param id - The session ID.
 * @returns The session record or null if not found.
 */
export async function getCodeAssistSession(
  id: number
): Promise<CodeAssistSession | null> {
  try {
    const session = await prisma.codeAssistSession.findUnique({
      where: { id },
      include: {
        codeGenerations: {
          orderBy: { createdAt: 'desc' },
        },
        codeReviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return session;
  } catch (error) {
    console.error(`Failed to get code assistant session ${id}:`, error);
    throw new Error('Unable to retrieve code assistant session');
  }
}

/**
 * Retrieves all code assistant sessions.
 * @returns Array of sessions.
 */
export function listCodeAssistSessions(): Promise<CodeAssistSession[]> {
  return prisma.codeAssistSession.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Updates a code assistant session.
 * @param id - The session ID.
 * @param data - The data to update.
 */
export async function updateCodeAssistSession(
  id: number,
  data: Partial<Pick<CodeAssistSession, 'title' | 'language'>>
): Promise<void> {
  try {
    await prisma.codeAssistSession.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Failed to update code assistant session ${id}:`, error);
    throw new Error('Unable to update code assistant session');
  }
}

/**
 * Deletes a code assistant session by ID.
 * @param id - The session ID.
 */
export async function deleteCodeAssistSession(id: number): Promise<void> {
  try {
    await prisma.codeAssistSession.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete code assistant session ${id}:`, error);
    throw new Error('Unable to delete code assistant session');
  }
}

/**
 * Creates a new code generation record.
 * @param params - Parameters for the code generation.
 * @returns The ID of the created generation.
 */
export async function createCodeGeneration(
  params: Pick<
    CodeGeneration,
    'sessionId' | 'prompt' | 'generatedCode' | 'language' | 'modelUsed'
  >
): Promise<{ id: number }> {
  try {
    const generation = await prisma.codeGeneration.create({
      data: {
        sessionId: params.sessionId,
        prompt: params.prompt,
        generatedCode: params.generatedCode,
        language: params.language,
        modelUsed: params.modelUsed,
      },
    });

    return { id: generation.id };
  } catch (error) {
    console.error('Failed to create code generation:', error);
    throw new Error('Unable to create code generation');
  }
}

/**
 * Retrieves code generations for a specific session.
 * @param sessionId - The session ID.
 * @returns Array of code generations.
 */
export async function getCodeGenerations(
  sessionId: number
): Promise<CodeGeneration[]> {
  try {
    const generations = await prisma.codeGeneration.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return generations;
  } catch (error) {
    console.error(
      `Failed to get code generations for session ${sessionId}:`,
      error
    );
    throw new Error('Unable to retrieve code generations');
  }
}

/**
 * Creates a new code review record.
 * @param params - Parameters for the code review.
 * @returns The ID of the created review.
 */
export async function createCodeReview(
  params: Pick<
    CodeReview,
    | 'sessionId'
    | 'codeInput'
    | 'reviewFeedback'
    | 'suggestions'
    | 'severityLevels'
  >
): Promise<{ id: number }> {
  try {
    const review = await prisma.codeReview.create({
      data: {
        sessionId: params.sessionId,
        codeInput: params.codeInput,
        reviewFeedback: params.reviewFeedback,
        suggestions: params.suggestions,
        severityLevels: params.severityLevels,
      },
    });

    return { id: review.id };
  } catch (error) {
    console.error('Failed to create code review:', error);
    throw new Error('Unable to create code review');
  }
}

/**
 * Retrieves code reviews for a specific session.
 * @param sessionId - The session ID.
 * @returns Array of code reviews.
 */
export async function getCodeReviews(sessionId: number): Promise<CodeReview[]> {
  try {
    const reviews = await prisma.codeReview.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  } catch (error) {
    console.error(
      `Failed to get code reviews for session ${sessionId}:`,
      error
    );
    throw new Error('Unable to retrieve code reviews');
  }
}

/**
 * Deletes a code generation by ID.
 * @param id - The generation ID.
 */
export async function deleteCodeGeneration(id: number): Promise<void> {
  try {
    await prisma.codeGeneration.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete code generation ${id}:`, error);
    throw new Error('Unable to delete code generation');
  }
}

/**
 * Deletes a code review by ID.
 * @param id - The review ID.
 */
export async function deleteCodeReview(id: number): Promise<void> {
  try {
    await prisma.codeReview.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete code review ${id}:`, error);
    throw new Error('Unable to delete code review');
  }
}
