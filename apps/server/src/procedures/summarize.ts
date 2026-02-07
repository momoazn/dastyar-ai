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
import { generateWithStructuredJsonFallback } from "@/services/ai-providers/llm-generation";
import { protectedProcedure } from "./base";

const SUMMARY_TEXT_SCHEMA = z.object({
  summaryText: z
    .string()
    .optional()
    .describe("Only the summary text. No extra commentary."),
});

const summarizeTextWithModel = async (params: {
  model: Parameters<typeof generateWithStructuredJsonFallback>[0]["model"];
  text: string;
  mode: SummaryMode;
  tone: Tone;
}): Promise<string> => {
  const { model, text, mode, tone } = params;
  const summaryText = await generateWithStructuredJsonFallback({
    model,
    schema: SUMMARY_TEXT_SCHEMA,
    structuredSystem: summarySystemPrompt({ mode, tone, format: "structured" }),
    jsonSystem: summarySystemPrompt({ mode, tone, format: "json" }),
    prompt: text,
    jsonField: "summaryText",
    readStructured: (result) => {
      if (
        !(
          typeof result === "object" &&
          result !== null &&
          "summaryText" in result
        )
      ) {
        return null;
      }
      const structuredSummaryText = (result as { summaryText?: unknown })
        .summaryText;
      return typeof structuredSummaryText === "string"
        ? structuredSummaryText
        : null;
    },
    temperature: 0.1,
  });

  if (!summaryText) {
    throw new Error("Failed to summarize text");
  }

  return summaryText;
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

      let summaryText = "";
      try {
        summaryText = await summarizeTextWithModel({
          model: providerLease.model,
          text: input.text,
          mode,
          tone,
        });
      } finally {
        providerLease.release();
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
