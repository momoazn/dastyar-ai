import { generateObject, generateText, type LanguageModel } from 'ai';
import { z } from 'zod';
import {
  createCodeAssistSession,
  createCodeGeneration,
  createCodeReview,
  deleteCodeAssistSession,
  deleteCodeGeneration,
  deleteCodeReview,
  getCodeAssistSession,
  getCodeGenerations,
  getCodeReviews,
  listCodeAssistSessions,
  updateCodeAssistSession,
} from '@/repositories/code';
import { getModelById } from '@/repositories/llm-models';
import { getProviderForModel } from '@/services';
import {
  extractJsonField,
  extractJsonObject,
  getFirstFieldName,
} from '@/utils/llm-json';
import { protectedProcedure, publicProcedure } from './base';

// Code generation schemas
const CodeGenerationSchema = z.object({
  generatedCode: z
    .string()
    .describe(
      'The generated code without any markdown formatting or code blocks'
    ),
  explanation: z
    .string()
    .optional()
    .describe('Brief explanation of the generated code'),
});

const CodeExplanationSchema = z.object({
  explanation: z.string().describe('Detailed explanation of the code'),
  breakdown: z
    .array(
      z.object({
        line: z.number().describe('Line number'),
        description: z.string().describe('Description of what this line does'),
      })
    )
    .optional()
    .describe('Line-by-line breakdown'),
  concepts: z
    .array(z.string())
    .optional()
    .describe('Key programming concepts used'),
  improvements: z
    .array(z.string())
    .optional()
    .describe('Potential improvements or best practices'),
});

const CodeReviewSchema = z.object({
  overallScore: z
    .number()
    .min(1)
    .max(10)
    .describe('Overall code quality score from 1-10'),
  feedback: z.string().describe('Overall feedback about the code'),
  suggestions: z
    .array(
      z.object({
        type: z.enum([
          'security',
          'performance',
          'style',
          'maintainability',
          'bug',
        ]),
        severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
        message: z.string().describe('Description of the issue or suggestion'),
        line: z.number().optional().describe('Line number if applicable'),
        fix: z.string().optional().describe('Suggested fix or improvement'),
      })
    )
    .describe('List of suggestions and issues found'),
});

const CodeDebugSchema = z.object({
  rootCause: z.string().describe('Analysis of the root cause of the error'),
  solution: z.string().describe('Step-by-step solution to fix the error'),
  codeFix: z.string().optional().describe('Corrected code if applicable'),
  prevention: z
    .array(z.string())
    .optional()
    .describe('Tips to prevent similar errors in the future'),
});

// Helper functions for structured output
const generateWithStructuredOutput = async <T>(
  model: LanguageModel,
  systemPrompt: string,
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<T> => {
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
    schema,
    prompt,
    temperature: 0.1,
  });
  return result.object;
};

const generateWithPlainJson = async <T>(
  model: LanguageModel,
  systemPrompt: string,
  prompt: string,
  schema: z.ZodSchema<T>
): Promise<Partial<T>> => {
  const { text: rawOutput } = await generateText({
    model,
    system: systemPrompt,
    prompt,
    temperature: 0.1,
  });

  // Try to extract and validate complete JSON object first
  const extractedObject = extractJsonObject(rawOutput, schema);
  if (extractedObject) {
    return extractedObject;
  }

  // Fallback to extracting specific fields
  const fieldName = getFirstFieldName(schema);
  if (fieldName) {
    const extractedValue = extractJsonField(rawOutput, fieldName);
    return {
      [fieldName]: extractedValue || rawOutput.trim(),
    } as Partial<T>;
  }

  // Last resort: return raw output as first field
  const firstField = getFirstFieldName(schema);
  return firstField
    ? ({ [firstField]: rawOutput.trim() } as Partial<T>)
    : ({} as Partial<T>);
};

export const codeProcedures = {
  // Session management
  listSessions: protectedProcedure.handler(async ({ context }) => {
    try {
      const sessions = await listCodeAssistSessions(context.user!.id);
      return sessions;
    } catch {
      return [] as const;
    }
  }),

  getSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const session = await getCodeAssistSession(input.id, context.user!.id);
      return session;
    }),

  updateSession: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1),
        language: z.string().min(1),
      })
    )
    .handler(async ({ input, context }) => {
      await updateCodeAssistSession(
        input.id,
        {
          title: input.title,
          language: input.language,
        },
        context.user!.id
      );
      return { ok: true } as const;
    }),

  deleteSession: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteCodeAssistSession(input.id, context.user!.id);
      return { ok: true } as const;
    }),

  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        language: z.string().min(1),
      })
    )
    .handler(async ({ input, context }) => {
      const session = await createCodeAssistSession({
        ...input,
        userId: context.user!.id,
      });
      return session;
    }),

  // Code generation
  generateCode: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        prompt: z.string().min(1),
        language: z.string().min(1),
        context: z.string().optional(),
        modelId: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error('Model not found');
      }
      const providerModel = getProviderForModel(model.name, model.provider);

      const systemPrompt = [
        `You are an expert ${input.language} developer. Generate clean, efficient, and well-structured code.`,
        'IMPORTANT: Return ONLY the code without any markdown formatting, code blocks, or explanations.',
        'The code should be production-ready and follow best practices.',
        'Always return a JSON object with the generated code.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ].join('\n');

      const userPrompt = [
        input.context ? `Context: ${input.context}` : '',
        `Task: ${input.prompt}`,
        `Language: ${input.language}`,
      ]
        .filter(Boolean)
        .join('\n');

      let result: z.infer<typeof CodeGenerationSchema> | null = null;
      try {
        result = await generateWithStructuredOutput(
          providerModel,
          systemPrompt,
          userPrompt,
          CodeGenerationSchema
        );
      } catch {
        console.error(
          'Could not generate code with structured output, falling back to plain json'
        );
      }

      if (!result?.generatedCode) {
        const fallbackResult = await generateWithPlainJson(
          providerModel,
          systemPrompt.replace(
            'Always return a JSON object with the generated code.\nPlease generate only the JSON output. DO NOT provide any preamble.',
            'Respond ONLY with a compact JSON object: {"generatedCode": "..."}.'
          ),
          userPrompt,
          CodeGenerationSchema
        );
        result = {
          generatedCode: fallbackResult.generatedCode || '',
          explanation: fallbackResult.explanation,
        };
      }

      const generation = await createCodeGeneration({
        sessionId: input.sessionId,
        prompt: input.prompt,
        generatedCode: (result?.generatedCode as string) || '',
        language: input.language,
        modelId: input.modelId,
        userId: context.user!.id,
      });

      return {
        ...generation,
        generatedCode: result?.generatedCode,
        explanation: result?.explanation,
      };
    }),

  // Code explanation
  explainCode: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        code: z.string().min(1),
        language: z.string().min(1),
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
        `You are an expert ${input.language} developer and educator. Provide clear, detailed explanations of code.`,
        'Explain what the code does, how it works, and any important concepts.',
        'Always return a JSON object with the explanation.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ].join('\n');

      const userPrompt = [
        `Language: ${input.language}`,
        'Code to explain:',
        '```',
        input.code,
        '```',
      ].join('\n');

      let result: z.infer<typeof CodeExplanationSchema> | null = null;
      try {
        result = await generateWithStructuredOutput(
          providerModel,
          systemPrompt,
          userPrompt,
          CodeExplanationSchema
        );
      } catch {
        console.error(
          'Could not explain code with structured output, falling back to plain json'
        );
      }

      if (!result?.explanation) {
        const fallbackResult = await generateWithPlainJson(
          providerModel,
          systemPrompt.replace(
            'Always return a JSON object with the explanation.\nPlease generate only the JSON output. DO NOT provide any preamble.',
            'Respond ONLY with a compact JSON object: {"explanation": "..."}.'
          ),
          userPrompt,
          CodeExplanationSchema
        );
        result = {
          explanation: fallbackResult.explanation || '',
          breakdown: fallbackResult.breakdown,
          concepts: fallbackResult.concepts,
          improvements: fallbackResult.improvements,
        };
      }

      return result;
    }),

  // Code review
  reviewCode: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        code: z.string().min(1),
        language: z.string().min(1),
        modelId: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error('Model not found');
      }
      const providerModel = getProviderForModel(model.name, model.provider);

      const systemPrompt = [
        `You are an expert ${input.language} code reviewer. Analyze code for security, performance, style, and maintainability issues.`,
        'Provide constructive feedback and actionable suggestions.',
        'Always return a JSON object with the review results.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ].join('\n');

      const userPrompt = [
        `Language: ${input.language}`,
        'Code to review:',
        '```',
        input.code,
        '```',
      ].join('\n');

      let result: z.infer<typeof CodeReviewSchema> | null = null;
      try {
        result = await generateWithStructuredOutput(
          providerModel,
          systemPrompt,
          userPrompt,
          CodeReviewSchema
        );
      } catch {
        console.error(
          'Could not review code with structured output, falling back to plain json'
        );
      }

      if (!result?.feedback) {
        const fallbackResult = await generateWithPlainJson(
          providerModel,
          systemPrompt.replace(
            'Always return a JSON object with the review results.\nPlease generate only the JSON output. DO NOT provide any preamble.',
            'Respond ONLY with a compact JSON object: {"feedback": "..."}.'
          ),
          userPrompt,
          CodeReviewSchema
        );
        result = {
          overallScore: fallbackResult.overallScore || 5,
          feedback: fallbackResult.feedback || '',
          suggestions: fallbackResult.suggestions || [],
        };
      }

      const review = await createCodeReview({
        sessionId: input.sessionId,
        codeInput: input.code,
        reviewFeedback: (result?.feedback as string) || '',
        suggestions: JSON.stringify(result?.suggestions || []),
        severityLevels: JSON.stringify(
          (result?.suggestions as Array<{ severity: string }>)?.map(
            (s) => s.severity
          ) || []
        ),
        modelId: input.modelId,
        userId: context.user!.id,
      });

      return {
        ...review,
        overallScore: result?.overallScore,
        feedback: result?.feedback,
        suggestions: result?.suggestions || [],
      };
    }),

  // Code debugging
  debugCode: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        code: z.string().min(1),
        error: z.string().min(1),
        language: z.string().min(1),
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
        `You are an expert ${input.language} debugger. Analyze errors and provide clear solutions.`,
        'Identify the root cause and provide step-by-step fixes.',
        'Always return a JSON object with the debugging analysis.',
        'Please generate only the JSON output. DO NOT provide any preamble.',
      ].join('\n');

      const userPrompt = [
        `Language: ${input.language}`,
        'Code:',
        '```',
        input.code,
        '```',
        `Error: ${input.error}`,
      ].join('\n');

      let result: z.infer<typeof CodeDebugSchema> | null = null;
      try {
        result = await generateWithStructuredOutput(
          providerModel,
          systemPrompt,
          userPrompt,
          CodeDebugSchema
        );
      } catch {
        console.error(
          'Could not debug code with structured output, falling back to plain json'
        );
      }

      if (!result?.rootCause) {
        const fallbackResult = await generateWithPlainJson(
          providerModel,
          systemPrompt.replace(
            'Always return a JSON object with the debugging analysis.\nPlease generate only the JSON output. DO NOT provide any preamble.',
            'Respond ONLY with a compact JSON object: {"rootCause": "..."}.'
          ),
          userPrompt,
          CodeDebugSchema
        );
        result = {
          rootCause: fallbackResult.rootCause || '',
          solution: fallbackResult.solution || '',
          codeFix: fallbackResult.codeFix,
          prevention: fallbackResult.prevention,
        };
      }

      return result;
    }),

  // Get generations and reviews for a session
  getGenerations: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .handler(async ({ input }) => {
      const generations = await getCodeGenerations(input.sessionId);
      return generations;
    }),

  getReviews: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .handler(async ({ input }) => {
      const reviews = await getCodeReviews(input.sessionId);
      return reviews;
    }),

  // Delete individual generations and reviews
  deleteGeneration: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteCodeGeneration(input.id);
      return { ok: true } as const;
    }),

  deleteReview: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      await deleteCodeReview(input.id);
      return { ok: true } as const;
    }),
};
