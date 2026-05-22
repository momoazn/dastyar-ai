import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  type LanguageCode,
  languageCodes,
  type Tone,
  type TranslationPayload,
  tones,
} from "@/database";
import { translationSystemPrompt } from "@/lib/prompts";
import {
  createTranslation,
  deleteTranslation,
  getTranslation,
  listTranslations,
} from "@/repositories/translations";
import { generateWithStructuredJsonFallback } from "@/services/ai-providers/llm-generation";
import { extractTextFromPdf } from "@/services/processors";
import { deleteDocumentFile, saveDocumentFromFile } from "@/services/storage";
import { protectedProcedure } from "./base";
import { withModelProviderById } from "./helpers/llm";

const STORAGE_TEXT_LIMIT = 12_000;
const TRANSLATION_CHUNK_LIMIT = 2800;
const DOUBLE_NEWLINE_RE = /\n{2,}/u;
const TRANSLATED_TEXT_SCHEMA = z.object({
  translatedText: z
    .string()
    .optional()
    .describe("Only the translated text. No extra commentary."),
});

// Prompts defined centrally in @/prompts

type TranslateTextParams = {
  model: Parameters<typeof generateWithStructuredJsonFallback>[0]["model"];
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  tone: Tone;
};

const translateTextWithModel = async ({
  model,
  text,
  sourceLanguage,
  targetLanguage,
  tone,
}: TranslateTextParams): Promise<string> => {
  try {
    const translatedText = await generateWithStructuredJsonFallback({
      model,
      schema: TRANSLATED_TEXT_SCHEMA,
      structuredSystem: translationSystemPrompt({
        sourceLanguage,
        targetLanguage,
        tone,
        format: "structured",
      }),
      jsonSystem: translationSystemPrompt({
        sourceLanguage,
        targetLanguage,
        tone,
        format: "json",
      }),
      prompt: text,
      jsonField: "translatedText",
      readStructured: (result) => {
        if (
          !(
            typeof result === "object" &&
            result !== null &&
            "translatedText" in result
          )
        ) {
          return null;
        }
        const structuredTranslatedText = (
          result as { translatedText?: unknown }
        ).translatedText;
        return typeof structuredTranslatedText === "string"
          ? structuredTranslatedText
          : null;
      },
    });

    if (!translatedText) {
      throw new ORPCError("TRANSLATION_EMPTY_RESULT", {
        message: "پاسخی از مدل دریافت نشد",
        status: 500,
      });
    }

    return translatedText;
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    throw new ORPCError("TRANSLATION_FAILED", {
      message:
        "ترجمه انجام نشد. لطفاً وضعیت مدل (LM Studio/Ollama) را بررسی کنید و دوباره تلاش کنید.",
      status: 502,
    });
  }
};

const saveTranslationOrThrow = async (
  params: Parameters<typeof createTranslation>[0]
) => {
  try {
    return await createTranslation(params);
  } catch {
    throw new ORPCError("TRANSLATION_PERSIST_FAILED", {
      message: "ذخیره‌سازی ترجمه ناموفق بود",
      status: 500,
    });
  }
};

const splitOversizeParagraph = (paragraph: string): string[] => {
  const parts: string[] = [];
  let start = 0;
  while (start < paragraph.length) {
    const end = Math.min(start + TRANSLATION_CHUNK_LIMIT, paragraph.length);
    parts.push(paragraph.slice(start, end));
    start = end;
  }
  return parts;
};

const chunkPageText = (text: string): string[] => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= TRANSLATION_CHUNK_LIMIT) {
    return [normalized];
  }

  const paragraphs = normalized
    .split(DOUBLE_NEWLINE_RE)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let buffer = "";
  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (candidate.length > TRANSLATION_CHUNK_LIMIT) {
      if (buffer) {
        chunks.push(buffer);
      }
      buffer = "";
      if (paragraph.length > TRANSLATION_CHUNK_LIMIT) {
        chunks.push(...splitOversizeParagraph(paragraph));
      } else {
        buffer = paragraph;
      }
    } else {
      buffer = candidate;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return [normalized];
  }
  return chunks;
};

const aggregatePages = (
  pages: TranslationPayload["pages"],
  key: "source_text" | "translated_text"
): string =>
  pages
    .filter((page) => page[key]?.trim())
    .map((page) => `[#${page.page}]\n${page[key]}`)
    .join("\n\n");

const truncateForStorage = (text: string): string => {
  if (!text) {
    return "";
  }
  return text.length > STORAGE_TEXT_LIMIT
    ? `${text.slice(0, STORAGE_TEXT_LIMIT)}...`
    : text;
};

export const translationProcedures = {
  list: protectedProcedure.handler(async ({ context }) => {
    const rows = await listTranslations(context.user.id);
    return rows;
  }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const row = await getTranslation(input.id, context.user.id);
      return row;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteTranslation(input.id, context.user.id);
      return { ok: true } as const;
    }),
  translate: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        sourceLanguage: z.enum(
          Object.values(languageCodes) as [string, ...string[]]
        ),
        targetLanguage: z.enum(
          Object.values(languageCodes) as [string, ...string[]]
        ),
        tone: z.enum(Object.values(tones) as [string, ...string[]]),
        modelId: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;
      const tone = input.tone as Tone;

      const translatedText = await withModelProviderById({
        modelId: input.modelId,
        notFoundMessage: "مدل مورد نظر پیدا نشد",
        handler: async ({ providerModel }) =>
          await translateTextWithModel({
            model: providerModel,
            text: input.text,
            sourceLanguage,
            targetLanguage,
            tone,
          }),
      });

      return await saveTranslationOrThrow({
        sourceText: input.text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        tone,
        modelId: input.modelId,
        userId: context.user.id,
        sourceType: "text",
        payload: null,
      });
    }),
  translatePdf: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        sourceLanguage: z.enum(
          Object.values(languageCodes) as [string, ...string[]]
        ),
        targetLanguage: z.enum(
          Object.values(languageCodes) as [string, ...string[]]
        ),
        tone: z.enum(Object.values(tones) as [string, ...string[]]),
        modelId: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;
      const tone = input.tone as Tone;

      const stored = await saveDocumentFromFile(input.file, input.file.name);

      let pdfPages: Awaited<ReturnType<typeof extractTextFromPdf>> = [];
      try {
        pdfPages = await extractTextFromPdf(stored.filePath);
      } finally {
        await deleteDocumentFile(stored.filePath);
      }

      if (pdfPages.length === 0) {
        throw new ORPCError("PDF_EXTRACTION_FAILED", {
          message: "استخراج متن از PDF ناموفق بود",
          status: 400,
        });
      }

      const translatedPages = await withModelProviderById({
        modelId: input.modelId,
        notFoundMessage: "مدل مورد نظر پیدا نشد",
        handler: async ({ providerModel }) => {
          const pages: TranslationPayload["pages"] = [];
          for (const page of pdfPages) {
            const chunks = chunkPageText(page.text);
            if (chunks.length === 0) {
              continue;
            }
            const translatedChunks: string[] = [];
            for (const chunk of chunks) {
              try {
                const chunkTranslation = await translateTextWithModel({
                  model: providerModel,
                  text: chunk,
                  sourceLanguage,
                  targetLanguage,
                  tone,
                });
                translatedChunks.push(chunkTranslation);
              } catch (error) {
                if (error instanceof ORPCError) {
                  throw new ORPCError(error.code, {
                    message: `ترجمه صفحه ${page.page} ناموفق بود: ${error.message}`,
                    status: error.status,
                    data: error.data,
                  });
                }
                throw error;
              }
            }
            if (translatedChunks.length === 0) {
              continue;
            }
            pages.push({
              page: page.page,
              source_text: page.text,
              translated_text: translatedChunks.join("\n\n"),
            });
          }
          return pages;
        },
      });

      if (translatedPages.length === 0) {
        throw new ORPCError("TRANSLATION_EMPTY_RESULT", {
          message: "ترجمه‌ای برای صفحات استخراج‌شده تولید نشد",
          status: 500,
        });
      }

      const payload: TranslationPayload = {
        page_count: pdfPages.length,
        pages: translatedPages,
      };

      const aggregatedSource = aggregatePages(translatedPages, "source_text");
      const aggregatedTranslation = aggregatePages(
        translatedPages,
        "translated_text"
      );

      return await saveTranslationOrThrow({
        sourceText: truncateForStorage(aggregatedSource),
        translatedText: truncateForStorage(aggregatedTranslation),
        sourceLanguage,
        targetLanguage,
        tone,
        modelId: input.modelId,
        userId: context.user.id,
        sourceType: "pdf",
        sourceFileName: input.file.name,
        payload,
      });
    }),
};
