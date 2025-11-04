import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { LLMModelProvider } from "@/database";
import { listLmstudioModels, lmstudioProvider } from "./lmstudio-provider";
import { listOllamaModels, ollamaProvider } from "./ollama-provider";

const providerToModel = {
  ollama: ollamaProvider,
  lmstudio: lmstudioProvider,
} as const;

const providerToListModels = {
  ollama: listOllamaModels,
  lmstudio: listLmstudioModels,
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
