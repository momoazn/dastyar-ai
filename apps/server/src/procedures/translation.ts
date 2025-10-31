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
import { getModelById } from "@/repositories/llm-models";
import {
  createTranslation,
  deleteTranslation,
  getTranslation,
  listTranslations,
} from "@/repositories/translations";
import { getProviderForModel } from "@/services/ai-providers";
import { extractTextFromPdf } from "@/services/processors";
import { deleteDocumentFile, saveDocumentFromFile } from "@/services/storage";
import { extractJsonField } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

const STORAGE_TEXT_LIMIT = 12_000;
const TRANSLATION_CHUNK_LIMIT = 2800;

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

const buildStructuredPrompt = (
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  tone: Tone
): string =>
  [
    `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
    `Use a ${tone} tone.`,
    "Preserve meaning and formatting. Return only the translated text without extra commentary.",
    "Always return a json object with the translated text.",
    "Please generate only the JSON output. DO NOT provide any preamble.",
  ]
    .filter(Boolean)
    .join("\n");

const buildPlainJsonPrompt = (
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode,
  tone: Tone
): string =>
  [
    `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
    `Use a ${tone} tone.`,
    "Preserve meaning and formatting.",
    'Respond ONLY with a compact JSON object: {"translatedText": "..."}.',
  ]
    .filter(Boolean)
    .join("\n");

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
      buildStructuredPrompt(sourceLanguage, targetLanguage, tone),
      text
    );
  } catch {
    translatedText = null;
  }

  if (!translatedText) {
    try {
      translatedText = await translateWithPlainJson(
        model,
        buildPlainJsonPrompt(sourceLanguage, targetLanguage, tone),
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

const chunkPageText = (text: string): string[] => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= TRANSLATION_CHUNK_LIMIT) {
    return [normalized];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
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
      if (paragraph.length > TRANSLATION_CHUNK_LIMIT) {
        let start = 0;
        while (start < paragraph.length) {
          const end = Math.min(
            start + TRANSLATION_CHUNK_LIMIT,
            paragraph.length
          );
          chunks.push(paragraph.slice(start, end));
          start = end;
        }
        buffer = "";
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
  key: "sourceText" | "translatedText"
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

      const providerModel = getProviderForModel(model.identifier, model.provider);
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;
      const tone = input.tone as Tone;

      const translatedText = await translateTextWithModel({
        model: providerModel,
        text: input.text,
        sourceLanguage,
        targetLanguage,
        tone,
      });

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

      const providerModel = getProviderForModel(model.identifier, model.provider);
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
        translatedPages.push({
          page: page.page,
          sourceText: page.text,
          translatedText: translatedChunks.join("\n\n"),
        });
      }

      if (translatedPages.length === 0) {
        throw new ORPCError("TRANSLATION_EMPTY_RESULT", {
          message: "ترجمه‌ای برای صفحات استخراج‌شده تولید نشد",
          status: 500,
        });
      }

      const payload: TranslationPayload = {
        pageCount: pdfPages.length,
        pages: translatedPages,
      };

      const aggregatedSource = aggregatePages(translatedPages, "sourceText");
      const aggregatedTranslation = aggregatePages(
        translatedPages,
        "translatedText"
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
