import { generateText } from "ai";
import { z } from "zod";
import { codeSystemPrompt } from "@/lib/prompts";
import { serverTexts } from "@/lib/texts";
import {
  createCodeRun,
  deleteCodeRun,
  getCodeRun,
  listCodeRuns,
} from "@/repositories/code-runs";
import { extractJsonObject } from "@/utils/llm-json";
import { protectedProcedure } from "./base";
import { withModelProviderById } from "./helpers/llm";

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

const THINK_BLOCK_REGEX = /<think>[\s\S]*?<\/think>/gi;
const MARKDOWN_CODE_BLOCK_REGEX =
  /```[^\S\r\n]*[a-zA-Z0-9_+#.-]*\s*([\s\S]*?)\s*```/;

function stripThinking(raw: string): string {
  return raw.replace(THINK_BLOCK_REGEX, "").trim();
}

function sanitizeGeneratedCodeOutput(raw: string): string {
  const withoutThinking = stripThinking(raw);
  const fencedMatch = withoutThinking.match(MARKDOWN_CODE_BLOCK_REGEX);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return withoutThinking;
}

const explanationSchema = z.object({ explanation: z.string() });
const reviewSchema = z
  .object({
    feedback: z.string().optional(),
    suggestions: z
      .union([z.array(z.string()), z.string(), z.null()])
      .optional(),
  })
  .transform((val) => {
    let suggestions: string[] = [];
    if (Array.isArray(val.suggestions)) {
      suggestions = val.suggestions.filter(Boolean);
    } else if (typeof val.suggestions === "string" && val.suggestions.trim()) {
      suggestions = [val.suggestions.trim()];
    }
    return {
      feedback: val.feedback ?? "",
      suggestions,
    };
  });

const debugSchema = z
  .object({
    rootCause: z.string().optional(),
    root_cause: z.string().optional(),
    solution: z.string().nullable().optional(),
    codeFix: z.string().nullable().optional(),
    code_fix: z.string().nullable().optional(),
  })
  .transform(
    (val): { rootCause: string; solution: string; codeFix?: string } => ({
      rootCause: val.rootCause ?? val.root_cause ?? "",
      solution: val.solution ?? "",
      codeFix: (val.codeFix ?? val.code_fix) || undefined,
    })
  );

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
    `Task: ${input.prompt ?? input.code ?? ""}`,
    `Language: ${input.language}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { text } = await makeRequest(system, userPrompt);
  const payload = { generatedCode: sanitizeGeneratedCodeOutput(text) } as const;
  await saveCodeRun({
    input,
    output: payload,
    inputText: input.prompt ?? input.code ?? "",
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
  const userPrompt = `Code:\n\n${input.code ?? input.prompt ?? ""}`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, explanationSchema);

  const payload = {
    explanation: parsed?.explanation || stripThinking(text),
  } as const;

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? input.prompt ?? "",
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
  const userPrompt = `Code to review:\n\n${input.code ?? input.prompt ?? ""}`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, reviewSchema);

  const payload = {
    feedback: parsed?.feedback || stripThinking(text),
    suggestions: parsed?.suggestions ?? [],
  } as const;

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? input.prompt ?? "",
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
  const userPrompt = `Code:\n\n${input.code ?? input.prompt ?? ""}\n\nError:\n${
    input.error ?? ""
  }`;
  const { text } = await makeRequest(system, userPrompt);
  const parsed = extractJsonObject(text, debugSchema);

  const payload: { rootCause: string; solution: string; codeFix?: string } =
    parsed && (parsed.rootCause || parsed.solution || parsed.codeFix)
      ? parsed
      : {
          rootCause: stripThinking(text),
          solution: "",
        };

  await saveCodeRun({
    input,
    output: payload,
    inputText: input.code ?? input.prompt ?? "",
    errorText: input.error ?? null,
    userId,
  });

  return payload;
}

export const codeProcedures = {
  run: protectedProcedure.input(codeRunInputSchema).handler(
    async ({ input, context }) =>
      await withModelProviderById({
        modelId: input.modelId,
        notFoundMessage: serverTexts.model.notFound,
        handler: async ({ providerModel }) => {
          const makeRequest: MakeRequest = (system, userPrompt) =>
            generateText({
              model: providerModel,
              system,
              prompt: userPrompt,
              temperature: 0.2,
            });

          switch (input.mode) {
            case "generate":
              return await handleGenerateMode(
                input,
                makeRequest,
                context.user.id
              );
            case "explain":
              return await handleExplainMode(
                input,
                makeRequest,
                context.user.id
              );
            case "review":
              return await handleReviewMode(
                input,
                makeRequest,
                context.user.id
              );
            case "debug":
              return await handleDebugMode(input, makeRequest, context.user.id);
            default:
              throw new Error(serverTexts.errors.invalidRequest);
          }
        },
      })
  ),
  listRuns: protectedProcedure.handler(async ({ context }) =>
    listCodeRuns(context.user.id)
  ),
  getRun: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .handler(async ({ input, context }) =>
      getCodeRun(input.id, context.user.id)
    ),
  deleteRun: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .handler(async ({ input, context }) => {
      await deleteCodeRun(input.id, context.user.id);
      return { ok: true } as const;
    }),
};
