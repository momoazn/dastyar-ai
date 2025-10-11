import { prisma, type Translation } from '@/database';

/**
 * Retrieves all translations.
 * @returns Array of translations.
 */
export function listTranslations(): Promise<Translation[]> {
  return prisma.translation.findMany();
}

/**
 * Creates a new translation record in the database.
 * @param params - The translation parameters excluding auto-generated fields.
 * @returns The created translation record.
 */
export async function createTranslation(
  params: Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>
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
 * @returns The translation record or null if not found.
 */
export async function getTranslation(id: number): Promise<Translation | null> {
  try {
    const translation = await prisma.translation.findUnique({
      where: { id },
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
 */
export async function deleteTranslation(id: number): Promise<void> {
  try {
    await prisma.translation.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to delete translation ${id}:`, error);
    throw new Error('Unable to delete translation');
  }
}
