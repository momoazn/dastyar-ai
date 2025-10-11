import { generateObject, generateText, type LanguageModel } from 'ai';
import { z } from 'zod';
import { getModelById } from '@/repositories/llm-models';
import {
  createSummary,
  deleteSummary,
  getSummary,
  listSummaries,
} from '@/repositories/summaries';
import { getProviderForModel } from '@/services';
import {
  type SummaryMode,
  summaryModePrompts,
  summaryModes,
  type Tone,
  tones,
} from '@/utils/constants';
import { extractJsonField } from '@/utils/llm-json';
import { publicProcedure } from './base';

const summarizeWithStructuredOutput = async (
  model: LanguageModel,
  systemPrompt: string,
  inputText: string
) => {
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
      summaryText: z
        .string()
        .optional()
        .describe('Only the summary text. No extra commentary.'),
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
  return extractJsonField(rawOutput, 'summaryText') ?? rawOutput.trim();
};

export const summarizeProcedures = {
  list: publicProcedure.handler(async () => {
    const rows = await listSummaries();
    return rows;
  }),
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const row = await getSummary(input.id);
      return row;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteSummary(input.id);
      return { ok: true } as const;
    }),
  create: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        mode: z.enum(summaryModes).default('standard'),
        tone: z.enum(tones).default('professional'),
        modelId: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error('Model not found');
      }
      const providerModel = getProviderForModel(model.name, model.provider);

      const systemPrompt = [
        'You are a professional summarizer. Create clear, accurate summaries.',
        'IMPORTANT: Always summarize in the same language as the source text.',
        summaryModePrompts[input.mode],
        `Use a ${input.tone} tone.`,
        'Preserve meaning and important details.',
        'Always return a json object with the summary text.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ]
        .filter(Boolean)
        .join('\n');

      let summaryText: string | null = null;
      try {
        summaryText = await summarizeWithStructuredOutput(
          providerModel,
          systemPrompt,
          input.text
        );
      } catch {
        // ignore and fallback
        console.error(
          '--- could not summarize with structured output, falling back to plain json'
        );
      }

      if (!summaryText) {
        summaryText = await summarizeWithPlainJson(
          providerModel,
          systemPrompt.replace(
            'Always return a json object with the summary text.\nPlease generate only the JSON output. DO NOT provide any preamble.',
            'Respond ONLY with a compact JSON object: {"summaryText": "..."}.'
          ),
          input.text
        );
      }

      const summary = await createSummary({
        sourceText: input.text,
        summaryText: summaryText || '',
        modelId: input.modelId,
        mode: input.mode as SummaryMode,
        tone: input.tone as Tone,
      });

      return summary;
    }),
};
