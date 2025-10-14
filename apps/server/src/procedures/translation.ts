import { generateObject, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { type LanguageCode, languageCodes, type Tone, tones } from "@/database";
import { getModelById } from "@/repositories/llm-models";
import {
  createTranslation,
  deleteTranslation,
  getTranslation,
  listTranslations,
} from "@/repositories/translations";
import { getProviderForModel } from "@/services";
import { extractJsonField } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

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
        throw new Error("Model not found");
      }
      const providerModel = getProviderForModel(model.name, model.provider);
      const sourceLanguage = input.sourceLanguage as LanguageCode;
      const targetLanguage = input.targetLanguage as LanguageCode;
      const tone = input.tone as Tone;

      const systemPrompt = [
        `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
        `Use a ${tone} tone.`,
        "Preserve meaning and formatting. Return only the translated text without extra commentary.",
        "Always return a json object with the translated text.",
        "Please generate only the JSON output. DO NOT provide any preamble.",
      ]
        .filter(Boolean)
        .join("\n");

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
          "--- could not translate with structured output, falling back to plain json"
        );
      }

      if (!translatedText) {
        translatedText = await translateWithPlainJson(
          providerModel,
          [
            `You are a professional translator. Translate the user's message from ${sourceLanguage} to ${targetLanguage}.`,
            `Use a ${tone} tone.`,
            "Preserve meaning and formatting.",
            'Respond ONLY with a compact JSON object: {"translatedText": "..."}.',
          ]
            .filter(Boolean)
            .join("\n"),
          input.text
        );
      }

      const created = await createTranslation({
        sourceText: input.text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        tone,
        modelId: input.modelId,
        userId: context.user?.id,
      });
      return created;
    }),
};
