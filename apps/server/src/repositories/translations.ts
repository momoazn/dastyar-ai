import { prisma, type Translation } from '@/database';

/**
 * Retrieves all translations for a user.
 * @param userId - The user ID.
 * @returns Array of translations.
 */
export function listTranslations(userId: number): Promise<Translation[]> {
  return prisma.translation.findMany({
    where: { userId },
  });
}

/**
 * Creates a new translation record in the database.
 * @param params - The translation parameters excluding auto-generated fields.
 * @returns The created translation record.
 */
export async function createTranslation(
  params: Omit<Translation, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & {
    userId: number;
  }
): Promise<Translation> {
  try {
    const translation = await prisma.translation.create({
      data: {
        sourceText: params.sourceText,
        translatedText: params.translatedText,
        modelId: params.modelId,
        sourceLanguage: params.sourceLanguage,
        targetLanguage: params.targetLanguage,
        tone: params.tone,
        userId: params.userId,
      },
    });

    return translation;
  } catch (error) {
    console.error('Failed to create translation:', error);
    throw new Error('Unable to create translation');
  }
}

/**
 * Retrieves a specific translation by ID.
 * @param id - The translation ID.
 * @param userId - The user ID.
 * @returns The translation record or null if not found.
 */
export async function getTranslation(
  id: number,
  userId: number
): Promise<Translation | null> {
  try {
    const translation = await prisma.translation.findFirst({
      where: { id, userId },
    });

    return translation;
  } catch (error) {
    console.error(`Failed to get translation ${id}:`, error);
    throw new Error('Unable to retrieve translation');
  }
}

/**
 * Deletes a specific translation by ID.
 * @param id - The translation ID.
 * @param userId - The user ID.
 */
export async function deleteTranslation(
  id: number,
  userId: number
): Promise<void> {
  try {
    await prisma.translation.deleteMany({
      where: { id, userId },
    });
  } catch (error) {
    console.error(`Failed to delete translation ${id}:`, error);
    throw new Error('Unable to delete translation');
  }
}
