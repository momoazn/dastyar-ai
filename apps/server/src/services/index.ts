import type { ModelProvider } from '@/utils/constants';
import { listLmstudioModels, lmstudioProvider } from './lmstudio';
import { listOllamaModels, ollamaProvider } from './ollama';

export type AnyProviderModel =
  | ReturnType<typeof ollamaProvider>
  | ReturnType<typeof lmstudioProvider>;

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
): AnyProviderModel => {
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
