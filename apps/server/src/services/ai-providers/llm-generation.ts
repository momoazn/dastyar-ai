import { generateObject, generateText, type LanguageModel } from "ai";
import type { z } from "zod";
import { extractJsonField } from "@/utils/llm-json";

const STRUCTURED_PROVIDER_OPTIONS = {
  lmstudio: { structuredOutputs: false },
  ollama: { structuredOutputs: false },
} as const;

type StructuredFallbackParams = {
  model: LanguageModel;
  schema: z.ZodType;
  structuredSystem: string;
  jsonSystem: string;
  prompt: string;
  jsonField: string;
  readStructured: (value: unknown) => string | null | undefined;
  temperature?: number;
};

export async function generateWithStructuredJsonFallback(
  params: StructuredFallbackParams
): Promise<string | null> {
  const {
    model,
    schema,
    structuredSystem,
    jsonSystem,
    prompt,
    jsonField,
    readStructured,
    temperature,
  } = params;

  try {
    const result = await generateObject({
      model,
      providerOptions: STRUCTURED_PROVIDER_OPTIONS,
      mode: "tool",
      system: structuredSystem,
      schema,
      prompt,
      ...(temperature !== undefined ? { temperature } : {}),
    });

    const structured = readStructured(result.object);
    if (structured?.trim()) {
      return structured.trim();
    }
  } catch {
    // Ignore structured generation errors and fallback to JSON extraction.
  }

  const { text: rawOutput } = await generateText({
    model,
    system: jsonSystem,
    prompt,
    ...(temperature !== undefined ? { temperature } : {}),
  });

  const extracted = extractJsonField(rawOutput, jsonField) ?? rawOutput.trim();
  return extracted.trim().length > 0 ? extracted.trim() : null;
}
