import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import {
  type SummaryMode,
  summaryModePrompts,
  summaryModes,
  type Tone,
  tones,
} from '@/utils/constants';
import { summariesTable } from '../../database/schema';
import {
  deleteSummary,
  getSummary,
  listSummaries,
} from '../../repositories/summaries';
import {
  type AnyProviderModel,
  getProviderForModel,
} from '../../services/ai-providers';
import { generateId } from '../../utils/id-generator';
import { publicProcedure } from '../index';

// Regex constants declared at top-level per performance best practices
const FENCED_JSON_OPEN = /^```json\s*/i;
const FENCED_OPEN = /^```\s*/i;
const FENCED_CLOSE = /```\s*$/i;
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;
const JSON_OBJECT_REGEX = /\{[\s\S]*?\}/g;

const extractSummaryTextFromRaw = (rawOutput: string): string | null => {
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
      const parsed = JSON.parse(candidate) as { summaryText?: unknown };
      if (
        parsed &&
        typeof parsed === 'object' &&
        Object.hasOwn(parsed, 'summaryText')
      ) {
        return String(parsed.summaryText ?? '');
      }
    } catch {
      // ignore and continue
    }
  }
  return null;
};

const summarizeWithStructuredOutput = async (
  model: AnyProviderModel,
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
  model: AnyProviderModel,
  systemPrompt: string,
  inputText: string
) => {
  const { text: rawOutput } = await generateText({
    model,
    system: systemPrompt,
    prompt: inputText,
    temperature: 0.1,
  });
  return extractSummaryTextFromRaw(rawOutput) ?? rawOutput.trim();
};

export const summarizeProcedures = {
  list: publicProcedure.handler(async () => {
    const rows = await listSummaries();
    return rows;
  }),
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      const row = await getSummary(input.id);
      return row;
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
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
        modelName: z.string(),
      })
    )
    .handler(async ({ input, context }) => {
      const providerModel = getProviderForModel(input.modelName);

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

      const id = generateId(15);
      const now = new Date();

      const summary = {
        id,
        sourceText: input.text,
        summaryText: summaryText || '',
        modelName: input.modelName,
        mode: input.mode as SummaryMode,
        tone: input.tone as Tone,
        createdAt: now,
        updatedAt: now,
      };

      await context.db.insert(summariesTable).values(summary);

      return summary;
    }),
};
