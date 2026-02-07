import { generateText } from "ai";
import { z } from "zod";
import { codeSystemPrompt } from "@/lib/prompts";
import {
  createCodeRun,
  deleteCodeRun,
  getCodeRun,
  listCodeRuns,
} from "@/repositories/code-runs";
import { getModelById } from "@/repositories/llm-models";
import { acquireProviderForModel } from "@/services/ai-providers";
import { extractJsonObject } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

const codeRunInputSchema = z.object({
  mode: z.enum(["generate", "explain", "review", "debug"]),
  language: z.string().min(1),
  modelId: z.number(),
  prompt: z.string().optional(),
  code: z.string().optional(),
  error: z.string().optional(),
  context: z.string().optional(),
});

type CodeRunInput = z.infer<typeof codeRunInputSchema>;

type MakeRequest = (
  system: string,
  userPrompt: string
) => Promise<{
  text: string;
}>;

const explanationSchema = z.object({ explanation: z.string() });
const reviewSchema = z.object({
  feedback: z.string(),
  suggestions: z.array(z.string()).optional(),
});
const debugSchema = z.object({
  rootCause: z.string(),
  solution: z.string(),
  codeFix: z.string().optional(),
});

async function saveCodeRun(params: {
  input: CodeRunInput;
  output: unknown;
  inputText: string;
  errorText: string | null;
  userId: number;
}) {
  const { input, output, inputText, errorText, userId } = params;
  await createCodeRun({
    mode: input.mode,
    language: input.language,
    inputText,
    errorText,
    output: JSON.stringify(output),
    modelId: input.modelId,
    userId,
  });
}

async function handleGenerateMode(
  input: CodeRunInput,
  makeRequest: MakeRequest,
  userId: number
) {
  const system = codeSystemPrompt({
    mode: "generate",
    language: input.language,
  });
  const userPrompt = [
    input.context ? `Context: ${input.context}` : "",
    `Task: ${input.prompt ?? ""}`,
    `Language: ${input.language}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await makeRequest(system, userPrompt);
  const payload = { generatedCode: text.trim() } as const;
  await saveCodeRun({
    input,
    output: payload,
    inputText: input.prompt ?? "",
    errorText: null,
    userId,
  });

  return payload;
}

async function handleExplainMode(
  input: CodeRunInput,
  makeRequest: MakeRequest,
  userId: number
) {
  const system = codeSystemPrompt({
    mode: "explain",
    language: input.language,
  });
  const userPrompt = `Code:\n\n${input.code ?? ""}`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, explanationSchema);

  const payload = {
    explanation: parsed?.explanation ?? text.trim(),
  } as const;

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? "",
    errorText: null,
    userId,
  });

  return payload;
}

async function handleReviewMode(
  input: CodeRunInput,
  makeRequest: MakeRequest,
  userId: number
) {
  const system = codeSystemPrompt({
    mode: "review",
    language: input.language,
  });
  const userPrompt = `Code to review:\n\n${input.code ?? ""}`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, reviewSchema);

  const payload = {
    feedback: parsed?.feedback ?? text.trim(),
    suggestions: parsed?.suggestions ?? [],
  } as const;

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? "",
    errorText: null,
    userId,
  });

  return payload;
}

async function handleDebugMode(
  input: CodeRunInput,
  makeRequest: MakeRequest,
  userId: number
) {
  const system = codeSystemPrompt({
    mode: "debug",
    language: input.language,
  });
  const userPrompt = `Code:\n\n${input.code ?? ""}\n\nError:\n${
    input.error ?? ""
  }`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, debugSchema);

  const payload = parsed ?? {
    rootCause: text.trim(),
    solution: "",
    codeFix: undefined,
  };

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? "",
    errorText: input.error ?? null,
    userId,
  });

  return payload;
}

export const codeProcedures = {
  run: protectedProcedure
    .input(codeRunInputSchema)
    .handler(async ({ input, context }) => {
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error("Model not found");
      }

      const providerLease = await acquireProviderForModel(
        model.identifier,
        model.provider
      );

      const makeRequest: MakeRequest = (system, userPrompt) =>
        generateText({
          model: providerLease.model,
          system,
          prompt: userPrompt,
          temperature: 0.2,
        });

      try {
        switch (input.mode) {
          case "generate":
            return await handleGenerateMode(
              input,
              makeRequest,
              context.user.id
            );
          case "explain":
            return await handleExplainMode(input, makeRequest, context.user.id);
          case "review":
            return await handleReviewMode(input, makeRequest, context.user.id);
          case "debug":
            return await handleDebugMode(input, makeRequest, context.user.id);
          default:
            throw new Error(`Unsupported mode: ${input.mode}`);
        }
      } finally {
        providerLease.release();
      }
    }),
  listRuns: protectedProcedure.handler(async ({ context }) =>
    listCodeRuns(context.user.id)
  ),
  getRun: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) =>
      getCodeRun(input.id, context.user.id)
    ),
  deleteRun: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteCodeRun(input.id, context.user.id);
      return { ok: true } as const;
    }),
};
