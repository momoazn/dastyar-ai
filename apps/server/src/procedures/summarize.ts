import { generateObject, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { type SummaryMode, summaryModes, type Tone, tones } from "@/database";
import { summarySystemPrompt } from "@/lib/prompts";
import { getModelById } from "@/repositories/llm-models";
import {
  createSummary,
  deleteSummary,
  getSummary,
  listSummaries,
} from "@/repositories/summaries";
import { acquireProviderForModel } from "@/services/ai-providers";
import { extractJsonField } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

const summarizeWithStructuredOutput = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
) => {
  const result = await generateObject({
    model,
    providerOptions: {
      lmstudio: { structuredOutputs: false },
      ollama: { structuredOutputs: false },
    },
    mode: "tool",
    system: systemPrompt,
    schema: z.object({
      summaryText: z
        .string()
        .optional()
        .describe("Only the summary text. No extra commentary."),
    }),
    prompt: inputText,
    temperature: 0.1,
  });
  return result.object.summaryText ?? null;
};

const summarizeWithPlainJson = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
) => {
  const { text: rawOutput } = await generateText({
    model,
    system: systemPrompt,
    prompt: inputText,
    temperature: 0.1,
  });
  return extractJsonField(rawOutput, "summaryText") ?? rawOutput.trim();
};

export const summarizeProcedures = {
  list: protectedProcedure.handler(async ({ context }) => {
    const rows = await listSummaries(context.user?.id);
    return rows;
  }),
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const row = await getSummary(input.id, context.user?.id);
      return row;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteSummary(input.id, context.user?.id);
      return { ok: true } as const;
    }),
  create: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        mode: z
          .enum(Object.values(summaryModes) as [string, ...string[]])
          .default("standard"),
        tone: z
          .enum(Object.values(tones) as [string, ...string[]])
          .default("professional"),
        modelId: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const mode = input.mode as SummaryMode;
      const tone = input.tone as Tone;
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error("Model not found");
      }
      const providerLease = await acquireProviderForModel(
        model.identifier,
        model.provider
      );

      const systemPrompt = summarySystemPrompt({
        mode,
        tone,
        format: "structured",
      });

      let summaryText: string | null = null;
      try {
        try {
          summaryText = await summarizeWithStructuredOutput(
            providerLease.model,
            systemPrompt,
            input.text
          );
        } catch {
          // ignore and fallback silently
        }

        if (!summaryText) {
          // fallback to plain json
          summaryText = await summarizeWithPlainJson(
            providerLease.model,
            summarySystemPrompt({ mode, tone, format: "json" }),
            input.text
          );
        }
      } finally {
        providerLease.release();
      }

      if (!summaryText) {
        throw new Error("Failed to summarize text");
      }

      const summary = await createSummary({
        sourceText: input.text,
        summaryText,
        mode,
        tone,
        modelId: input.modelId,
        userId: context.user?.id,
      });

      return summary;
    }),
};
