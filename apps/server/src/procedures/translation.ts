import { ORPCError } from "@orpc/client";
import { generateObject, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import {
  type LanguageCode,
  languageCodes,
  type Tone,
  type TranslationPayload,
  tones,
} from "@/database";
import { translationSystemPrompt } from "@/lib/prompts";
import { getModelById } from "@/repositories/llm-models";
import {
  createTranslation,
  deleteTranslation,
  getTranslation,
  listTranslations,
} from "@/repositories/translations";
import { acquireProviderForModel } from "@/services/ai-providers";
import { extractTextFromPdf } from "@/services/processors";
import { deleteDocumentFile, saveDocumentFromFile } from "@/services/storage";
import { extractJsonField } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

const STORAGE_TEXT_LIMIT = 12_000;
const TRANSLATION_CHUNK_LIMIT = 2800;
const DOUBLE_NEWLINE_RE = /\n{2,}/u;

const translateWithStructuredOutput = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
): Promise<string | null> => {
  const result = await generateObject({
    model,
    providerOptions: {
      lmstudio: { structuredOutputs: false },
      ollama: { structuredOutputs: false },
    },
    mode: "tool",
    system: systemPrompt,
    schema: z.object({
      translatedText: z
        .string()
        .optional()
        .describe("Only the translated text. No extra commentary."),
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
  return extractJsonField(rawOutput, "translatedText") ?? rawOutput.trim();
};

// Prompts defined centrally in @/prompts

type TranslateTextParams = {
  model: LanguageModel;
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
  let translatedText: string | null = null;

  try {
    translatedText = await translateWithStructuredOutput(
      model,
      translationSystemPrompt({
        sourceLanguage,
        targetLanguage,
        tone,
        format: "structured",
      }),
      text
    );
  } catch {
    translatedText = null;
  }

  if (!translatedText) {
    try {
      translatedText = await translateWithPlainJson(
        model,
        translationSystemPrompt({
          sourceLanguage,
          targetLanguage,
          tone,
          format: "json",
        }),
        text
      );
    } catch {
      throw new ORPCError("TRANSLATION_FAILED", {
        message:
          "ترجمه انجام نشد. لطفاً وضعیت مدل (LM Studio/Ollama) را بررسی کنید و دوباره تلاش کنید.",
        status: 502,
      });
    }
  }

  if (!translatedText) {
    throw new ORPCError("TRANSLATION_EMPTY_RESULT", {
      message: "پاسخی از مدل دریافت نشد",
      status: 500,
    });
  }

  return translatedText;
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
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new ORPCError("MODEL_NOT_FOUND", {
          message: "مدل مورد نظر پیدا نشد",
          status: 400,
        });
      }

      const providerLease = await acquireProviderForModel(
        model.identifier,
        model.provider
      );
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;
      const tone = input.tone as Tone;

      let translatedText = "";
      try {
        translatedText = await translateTextWithModel({
          model: providerLease.model,
          text: input.text,
          sourceLanguage,
          targetLanguage,
          tone,
        });
      } finally {
        providerLease.release();
      }

      try {
        const created = await createTranslation({
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
        return created;
      } catch {
        throw new ORPCError("TRANSLATION_PERSIST_FAILED", {
          message: "ذخیره‌سازی ترجمه ناموفق بود",
          status: 500,
        });
      }
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
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new ORPCError("MODEL_NOT_FOUND", {
          message: "مدل مورد نظر پیدا نشد",
          status: 400,
        });
      }

      const providerLease = await acquireProviderForModel(
        model.identifier,
        model.provider
      );
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

      const translatedPages: TranslationPayload["pages"] = [];
      try {
        for (const page of pdfPages) {
          const chunks = chunkPageText(page.text);
          if (chunks.length === 0) {
            continue;
          }
          const translatedChunks: string[] = [];
          for (const chunk of chunks) {
            try {
              const chunkTranslation = await translateTextWithModel({
                model: providerLease.model,
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
          translatedPages.push({
            page: page.page,
            source_text: page.text,
            translated_text: translatedChunks.join("\n\n"),
          });
        }
      } finally {
        providerLease.release();
      }

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

      try {
        const created = await createTranslation({
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
        return created;
      } catch {
        throw new ORPCError("TRANSLATION_PERSIST_FAILED", {
          message: "ذخیره‌سازی ترجمه ناموفق بود",
          status: 500,
        });
      }
    }),
};
