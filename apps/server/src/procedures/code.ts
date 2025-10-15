import { generateText } from "ai";
import { z } from "zod";
import { getModelById } from "@/repositories/llm-models";
import { getProviderForModel } from "@/services";
import { extractJsonObject } from "@/utils/llm-json";
import { protectedProcedure } from "./base";

export const codeProcedures = {
  run: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["generate", "explain", "review", "debug"]),
        language: z.string().min(1),
        modelId: z.number(),
        prompt: z.string().optional(),
        code: z.string().optional(),
        error: z.string().optional(),
        context: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const model = await getModelById(input.modelId);
      if (!model) {
        throw new Error("Model not found");
      }
      const providerModel = getProviderForModel(model.name, model.provider);
      const makeRequest = (s: string, u: string) =>
        generateText({
          model: providerModel,
          system: s,
          prompt: u,
          temperature: 0.2,
        });

      if (input.mode === "generate") {
        const sys = `You are an expert ${input.language} developer. Return ONLY code, no markdown, no backticks.`;
        const user = [
          input.context ? `Context: ${input.context}` : "",
          `Task: ${input.prompt ?? ""}`,
          `Language: ${input.language}`,
        ]
          .filter(Boolean)
          .join("\n");
        const { text } = await makeRequest(sys, user);
        return { generatedCode: text.trim() } as const;
      }

      if (input.mode === "explain") {
        const sys = `Explain the following ${input.language} code clearly.`;
        const user = `Code:\n\n${input.code ?? ""}`;
        const { text } = await makeRequest(sys, user);
        const parsed = extractJsonObject(
          text,
          z.object({ explanation: z.string() })
        );
        return { explanation: parsed?.explanation ?? text.trim() } as const;
      }

      if (input.mode === "review") {
        const sys = `Review the ${input.language} code. Return JSON with keys: feedback (string) and suggestions (string[]).`;
        const user = `Code to review:\n\n${input.code ?? ""}`;
        const { text } = await makeRequest(sys, user);
        const parsed = extractJsonObject(
          text,
          z.object({
            feedback: z.string(),
            suggestions: z.array(z.string()).optional(),
          })
        );
        return {
          feedback: parsed?.feedback ?? text.trim(),
          suggestions: parsed?.suggestions ?? [],
        } as const;
      }

      // debug
      const sys = `Debug the ${input.language} code and error. Return JSON with rootCause (string), solution (string), and optional codeFix (string).`;
      const user = `Code:\n\n${input.code ?? ""}\n\nError:\n${input.error ?? ""}`;
      const { text: dbgText } = await makeRequest(sys, user);
      const parsed = extractJsonObject(
        dbgText,
        z.object({
          rootCause: z.string(),
          solution: z.string(),
          codeFix: z.string().optional(),
        })
      );
      if (parsed) {
        return parsed as {
          rootCause: string;
          solution: string;
          codeFix?: string;
        };
      }
      return {
        rootCause: dbgText.trim(),
        solution: "",
        codeFix: undefined,
      } as const;
    }),
};
