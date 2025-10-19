import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { LLMModelProvider } from "@/database";
import { geminiProvider, listGeminiModels } from "./gemini";
import { groqProvider, listGroqModels } from "./groq";
import { listLmstudioModels, lmstudioProvider } from "./lmstudio";
import { listOllamaModels, ollamaProvider } from "./ollama";
import { listOpenRouterModels, openrouterProvider } from "./openrouter";

const providerToModel = {
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
  openrouter: openrouterProvider,
  groq: groqProvider,
  gemini: geminiProvider,
} as const;

const providerToListModels = {
  ollama: listOllamaModels,
  lmstudio: listLmstudioModels,
  openrouter: listOpenRouterModels,
  groq: listGroqModels,
  gemini: listGeminiModels,
} as const;

export async function listAllModels(): Promise<
  { name: string; provider: LLMModelProvider }[]
> {
  return (
    await Promise.all(
      Object.values(providerToListModels).map((listModels) => listModels())
    )
  ).flat();
}

export function getProviderForModel(
  name: string,
  provider: LLMModelProvider = "ollama"
): LanguageModelV2 {
  return providerToModel[provider](name);
}
