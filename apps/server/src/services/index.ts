import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ModelProvider } from '@/utils/constants';
import { listLmstudioModels, lmstudioProvider } from './lmstudio';
import { listOllamaModels, ollamaProvider } from './ollama';

export async function listAllModels(): Promise<
  { name: string; provider: ModelProvider }[]
> {
  const ollamaModels = await listOllamaModels();
  const lmstudioModels = await listLmstudioModels();

  return [...ollamaModels, ...lmstudioModels];
}

export const getProviderForModel = (
  model: string,
  modelProvider: ModelProvider = 'ollama'
): LanguageModelV2 => {
  if (!modelProvider) {
    return ollamaProvider(model);
  }

  switch (modelProvider) {
    case 'ollama':
      return ollamaProvider(model);
    case 'lmstudio':
      return lmstudioProvider(model);
    default:
      return ollamaProvider(model);
  }
};
