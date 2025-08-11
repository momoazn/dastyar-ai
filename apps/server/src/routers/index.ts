import { type GenerateObjectResult, generateObject } from 'ai';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { ModelProviderEnum, models, translations } from '../db/schema';
import { getProviderForModel } from '../lib/ai';
import { publicProcedure } from '../lib/orpc';
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
        // Return all models from database (limited to supported providers if provided)
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
                : inArray(models.provider, [
                    ModelProviderEnum.LMSTUDIO,
                    ModelProviderEnum.OLLAMA,
                    ModelProviderEnum.OPENROUTER,
                  ])
            )
          );

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
        ]
          .filter(Boolean)
          .join('\n');

        console.log('####', systemPrompt);

        let result: GenerateObjectResult<{ translatedText: string }>;
        try {
          result = await generateObject({
            model: providerModel,
            system: systemPrompt,
            schema: z.object({
              translatedText: z
                .string()
                .optional()
                .describe('Only the translated text. No extra commentary.'),
            }),
            prompt: input.text,
          });

          console.log('#### in try', result);
        } catch (error) {
          console.error('#### in catch', error);
          throw error;
        }

        console.log('#### in finally', result);

        if (!result) {
          return { id: null, translatedText: null } as const;
        }

        const id = generateId(15);
        await context.db.insert(translations).values({
          id,
          sourceText: input.text,
          translatedText: result.object.translatedText,
          modelId: model?.[0].id,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          tone: (input.tone as Tone) ?? null,
        });

        return { id, translatedText: result.object.translatedText } as const;
      }),
  },
};

export type AppRouter = typeof appRouter;
