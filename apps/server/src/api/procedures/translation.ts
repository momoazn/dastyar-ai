import { generateObject, generateText } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { models, translations } from '../../database/schema';
import {
  deleteTranslation,
  getTranslation,
  listTranslations,
} from '../../repositories/translations';
import {
  type AnyProviderModel,
  getProviderForModel,
} from '../../services/ai-providers';
import {
  codeToLanguage,
  codeToLanguageMap,
  type LanguageCode,
  type Tone,
  toneToLabelMap,
} from '../../utils/constants';
import { generateId } from '../../utils/id-generator';
import { publicProcedure } from '../index';

// Regex constants declared at top-level per performance best practices
const FENCED_JSON_OPEN = /^```json\s*/i;
const FENCED_OPEN = /^```\s*/i;
const FENCED_CLOSE = /```\s*$/i;
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
const JSON_OBJECT_REGEX = /\{[\s\S]*?\}/g;

const extractTranslatedTextFromRaw = (rawOutput: string): string | null => {
  // Remove DeepSeek-style reasoning blocks first
  const cleaned = rawOutput
    .trim()
    .replace(THINK_BLOCK, '')
    .replace(FENCED_JSON_OPEN, '')
    .replace(FENCED_OPEN, '')
    .replace(FENCED_CLOSE, '');
  const candidates = cleaned.match(JSON_OBJECT_REGEX) ?? [];
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const candidate = candidates[i];
    try {
      const parsed = JSON.parse(candidate) as { translatedText?: unknown };
      if (
        parsed &&
        typeof parsed === 'object' &&
        Object.hasOwn(parsed, 'translatedText')
      ) {
        return String(parsed.translatedText ?? '');
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
};

const translateWithStructuredOutput = async (
  model: AnyProviderModel,
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
  model: AnyProviderModel,
  systemPrompt: string,
  inputText: string
): Promise<string> => {
  const { text: rawOutput } = await generateText({
    model,
    system: systemPrompt,
    prompt: inputText,
  });
  return extractTranslatedTextFromRaw(rawOutput) ?? rawOutput.trim();
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
        sourceLanguage: z.enum(Object.keys(codeToLanguageMap)),
        targetLanguage: z.enum(Object.keys(codeToLanguageMap)),
        tone: z.enum(Object.keys(toneToLabelMap)).optional(),
        modelId: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const selectedModelId = input.modelId ?? '';
      const model = await context.db
        .select()
        .from(models)
        .where(eq(models.id, selectedModelId))
        .limit(1);

      if (!model?.[0]) {
        throw new Error('Model not found');
      }

      const providerModel = getProviderForModel(model?.[0]);
      const sourceLanguage = codeToLanguage(
        input.sourceLanguage as LanguageCode
      );
      const targetLanguage = codeToLanguage(
        input.targetLanguage as LanguageCode
      );

      const systemPrompt = [
        `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
        input.tone ? `Use a ${input.tone} tone.` : undefined,
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
            input.tone ? `Use a ${input.tone} tone.` : undefined,
            'Preserve meaning and formatting.',
            'Respond ONLY with a compact JSON object: {"translatedText": "..."}.',
          ]
            .filter(Boolean)
            .join('\n'),
          input.text
        );
      }

      const id = generateId(15);
      const created = await context.db
        .insert(translations)
        .values({
          id,
          sourceText: input.text,
          translatedText,
          modelId: model?.[0].id,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          tone: (input.tone as Tone) ?? null,
        })
        .returning();
      return created[0];
    }),
};
