import { generateObject, generateText } from 'ai';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { models, translations } from '../db/schema';
import { getProviderForModel } from '../lib/providers';
import { ModelProviderEnum } from '../lib/providers/constants';
import {
  clearThread,
  createThread,
  deleteMessage,
  deleteThread,
  deleteTranslation,
  getMessagesByThread,
  getThread,
  getTranslation,
  listThreads,
  listTranslations,
  renameThread,
  setArchived,
  syncModels,
} from '../lib/repository';
import {
  codeToLanguage,
  codeToLanguageMap,
  type LanguageCode,
  type Tone,
  toneToLabelMap,
} from '../lib/translate';
import { generateId } from '../lib/utils';
import { publicProcedure } from './index';

// Regex constants declared at top-level per performance best practices
const FENCED_JSON_OPEN = /^```json\s*/i;
const FENCED_OPEN = /^```\s*/i;
const FENCED_CLOSE = /```\s*$/i;
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
const JSON_OBJECT_REGEX = /\{[\s\S]*?\}/g;

const extractTranslatedTextFromRaw = (rawOutput: string): string | null => {
  // Remove DeepSeek-style reasoning blocks first
  const withoutThink = rawOutput.replace(THINK_BLOCK, '');
  const cleaned = withoutThink
    .trim()
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
  model: ReturnType<typeof getProviderForModel>,
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
  model: ReturnType<typeof getProviderForModel>,
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

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return 'OK';
  }),
  models: {
    list: publicProcedure
      .input(
        z.object({
          isEnabled: z.boolean().optional(),
          providers: z
            .array(z.enum(Object.values(ModelProviderEnum)))
            .optional(),
        })
      )
      .handler(async ({ context, input }) => {
        const rows = await context.db
          .select({
            id: models.id,
            name: models.name,
            provider: models.provider,
            isEnabled: models.isEnabled,
          })
          .from(models)
          .where(
            and(
              input.isEnabled ? eq(models.isEnabled, true) : undefined,
              input.providers
                ? inArray(models.provider, input.providers)
                : inArray(models.provider, Object.values(ModelProviderEnum))
            )
          )
          .orderBy(asc(models.name));

        const providerPriority: Record<string, number> = {
          [ModelProviderEnum.OLLAMA]: 0,
          [ModelProviderEnum.LMSTUDIO]: 1,
        };
        rows.sort((a, b) => {
          const pa = providerPriority[a.provider] ?? 2;
          const pb = providerPriority[b.provider] ?? 2;
          if (pa !== pb) {
            return pa - pb;
          }
          return a.name.localeCompare(b.name);
        });

        return rows;
      }),
    sync: publicProcedure.handler(async () => {
      await syncModels();
      return { ok: true } as const;
    }),
  },
  threads: {
    create: publicProcedure
      .input(z.object({ title: z.string().optional() }).optional())
      .handler(async ({ input }) => {
        const created = await createThread({ title: input?.title });
        return created;
      }),
    list: publicProcedure
      .input(
        z
          .object({ includeArchived: z.boolean().optional().default(false) })
          .optional()
      )
      .handler(async ({ input }) => {
        try {
          const rows = await listThreads({
            includeArchived: input?.includeArchived,
          });
          return rows;
        } catch {
          return [] as const;
        }
      }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const row = await getThread(input.id);
        return row;
      }),
    rename: publicProcedure
      .input(z.object({ id: z.string(), title: z.string().min(1) }))
      .handler(async ({ input }) => {
        await renameThread(input.id, input.title);
        return { ok: true } as const;
      }),
    archive: publicProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await setArchived(input.id, true);
        return { ok: true } as const;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await deleteThread(input.id);
        return { ok: true } as const;
      }),
  },
  messages: {
    listByThread: publicProcedure
      .input(
        z.object({
          threadId: z.string(),
          limit: z.number().optional(),
          cursor: z.string().optional(),
          order: z.enum(['asc', 'desc']).optional(),
        })
      )
      .handler(async ({ input }) => {
        const rows = await getMessagesByThread({
          threadId: input.threadId,
          limit: input.limit,
          cursor: input.cursor ?? null,
          order: input.order ?? 'desc',
        });
        return rows;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        await deleteMessage(input.id);
        return { ok: true } as const;
      }),
    clearThread: publicProcedure
      .input(z.object({ threadId: z.string() }))
      .handler(async ({ input }) => {
        await clearThread(input.threadId);
        return { ok: true } as const;
      }),
  },
  translations: {
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
  },
  transcribe: {
    transcribe: publicProcedure
      .input(
        z.object({
          file: z.instanceof(File),
          language: z.string().length(2).optional(),
          model: z.string().optional().default('tiny'),
          responseFormat: z
            .enum(['json', 'text', 'verbose'])
            .optional()
            .default('json'),
          includeTimestamps: z.boolean().optional().default(true),
        })
      )
      .output(
        z.object({
          text: z.string(),
          language: z.string().optional(),
          model_used: z.string().optional(),
          processing_ms: z.number().optional(),
          segments: z
            .array(
              z.object({
                start: z.number(),
                end: z.number(),
                text: z.string(),
              })
            )
            .optional(),
        })
      )
      .handler(async ({ input }) => {
        const whisperPort = process.env.WHISPER_PORT || '40002';
        const whisperServiceUrl =
          process.env.WHISPER_SERVICE_URL || `http://localhost:${whisperPort}`;

        // Validate file size (50MB limit)
        const maxFileSize = 50 * 1024 * 1024;
        if (input.file.size > maxFileSize) {
          throw new Error(
            `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`
          );
        }

        // Validate file type
        const supportedTypes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/x-wav',
          'audio/m4a',
          'audio/mp4',
          'audio/flac',
          'audio/ogg',
          'audio/webm',
          'video/mp4',
          'video/webm',
        ];
        if (!supportedTypes.includes(input.file.type)) {
          throw new Error(`Unsupported file format: ${input.file.type}`);
        }

        // Create FormData to send file to Python whisper service
        const formData = new FormData();
        formData.append('file', input.file);

        // Append individual fields per updated Whisper API
        formData.append('model', input.model);
        if (input.language) {
          formData.append('language', input.language);
        }
        formData.append('response_format', input.responseFormat);
        formData.append('include_timestamps', String(input.includeTimestamps));

        const response = await fetch(`${whisperServiceUrl}/api/transcribe`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(120_000), // 2 minute timeout
        });

        if (!response.ok) {
          let errorMessage = `Transcription failed: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            if (errorBody.detail) {
              errorMessage = `Transcription failed: ${errorBody.detail}`;
            }
          } catch {
            // Ignore JSON parse errors, use default message
          }
          throw new Error(errorMessage);
        }

        let result: unknown;
        try {
          result = await response.json();
        } catch {
          throw new Error('Invalid response from transcription service');
        }

        // Validate and normalize response
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format from transcription service');
        }

        // Type the result object based on expected whisper service response
        const typedResult = result as {
          text?: string;
          language?: string;
          model_used?: string;
          processing_ms?: number;
          segments?: Array<{ start: number; end: number; text: string }>;
        };

        // Handle different response formats from the Python service
        if (input.responseFormat === 'text') {
          // When format is 'text', Python service returns: { "text": "..." }
          const text =
            typeof result === 'string'
              ? result
              : typedResult.text || String(result);
          if (!text.trim()) {
            throw new Error('No transcription text received');
          }
          return { text: text.trim() };
        }

        // For 'json' and 'verbose' formats, return the structured response
        const transcriptionText = typedResult.text || '';
        if (!transcriptionText.trim()) {
          throw new Error('No transcription text received');
        }

        return {
          text: transcriptionText.trim(),
          language: typedResult.language || undefined,
          model_used: typedResult.model_used || undefined,
          processing_ms:
            typeof typedResult.processing_ms === 'number'
              ? typedResult.processing_ms
              : undefined,
          segments: Array.isArray(typedResult.segments)
            ? typedResult.segments
            : undefined,
        };
      }),
  },
};

export type AppRouter = typeof appRouter;
