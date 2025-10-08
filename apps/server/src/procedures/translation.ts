import { generateObject, generateText, type LanguageModel } from 'ai';
import { z } from 'zod';
import { translationsTable } from '@/database/schema';
import {
  deleteTranslation,
  getTranslation,
  listTranslations,
} from '@/repositories/translations';
import { getProviderForModel } from '@/services';
import {
  type LanguageCode,
  languageCodes,
  ModelProviderEnum,
  type Tone,
  tones,
} from '@/utils/constants';
import { generateId } from '@/utils/id-generator';
import { extractJsonField } from '@/utils/llm-json';
import { publicProcedure } from './index';

const translateWithStructuredOutput = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
): Promise<string | null> => {
  const result = await generateObject({
    model,
    providerOptions: {
      openai: { structuredOutputs: false },
      lmstudio: { structuredOutputs: false },
      ollama: { structuredOutputs: false },
      openrouter: { structuredOutputs: false },
    },
    mode: 'tool',
    system: systemPrompt,
    schema: z.object({
      translatedText: z
        .string()
        .optional()
        .describe('Only the translated text. No extra commentary.'),
    }),
    prompt: inputText,
  });
  return result.object.translatedText ?? null;
};

const translateWithPlainJson = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
): Promise<string> => {
  const { text: rawOutput } = await generateText({
    model,
    system: systemPrompt,
    prompt: inputText,
  });
  return extractJsonField(rawOutput, 'translatedText') ?? rawOutput.trim();
};

export const translationProcedures = {
  list: publicProcedure.handler(async () => {
    const rows = await listTranslations();
    return rows;
  }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const row = await getTranslation(input.id);
      return row;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      await deleteTranslation(input.id);
      return { ok: true } as const;
    }),
  translate: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        sourceLanguage: z.enum(languageCodes),
        targetLanguage: z.enum(languageCodes),
        tone: z.enum(tones),
        modelName: z.string(),
        modelProvider: z.enum(ModelProviderEnum).optional().default('ollama'),
      })
    )
    .handler(async ({ input, context }) => {
      const providerModel = getProviderForModel(
        input.modelName,
        input.modelProvider
      );
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;

      const systemPrompt = [
        `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
        `Use a ${input.tone} tone.`,
        'Preserve meaning and formatting. Return only the translated text without extra commentary.',
        'Always return a json object with the translated text.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ]
        .filter(Boolean)
        .join('\n');

      let translatedText: string | null = null;
      try {
        translatedText = await translateWithStructuredOutput(
          providerModel,
          systemPrompt,
          input.text
        );
      } catch {
        // ignore and fallback
        console.error(
          '--- could not translate with structured output, falling back to plain json'
        );
      }

      if (!translatedText) {
        translatedText = await translateWithPlainJson(
          providerModel,
          [
            `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
            `Use a ${input.tone} tone.`,
            'Preserve meaning and formatting.',
            'Respond ONLY with a compact JSON object: {"translatedText": "..."}.',
          ]
            .filter(Boolean)
            .join('\n'),
          input.text
        );
      }

      const id = generateId();
      const created = await context.db
        .insert(translationsTable)
        .values({
          id,
          sourceText: input.text,
          translatedText,
          modelName: input.modelName,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          tone: (input.tone as Tone) ?? null,
        })
        .returning();
      return created[0];
    }),
};
