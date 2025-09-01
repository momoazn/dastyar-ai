import type { ModelProvider } from '@/utils/constants';
import { geminiProvider, listGeminiModels } from './gemini';
import { groqProvider, listGroqModels } from './groq';
import { listLmstudioModels, lmstudioProvider } from './lmstudio';
import { listOllamaModels, ollamaProvider } from './ollama';
import { listOpenrouterModels, openrouterProvider } from './openrouter';

export type AnyProviderModel =
  | ReturnType<typeof ollamaProvider>
  | ReturnType<typeof lmstudioProvider>
  | ReturnType<typeof openrouterProvider>
  | ReturnType<typeof groqProvider>
  | ReturnType<typeof geminiProvider>;

export async function listAllModels(): Promise<
  { name: string; provider: ModelProvider }[]
> {
  const ollamaModels = await listOllamaModels();
  const lmstudioModels = await listLmstudioModels();
  const openrouterModels = listOpenrouterModels();
  const groqModels = listGroqModels();
  const geminiModels = listGeminiModels();

  return [
    ...ollamaModels,
    ...lmstudioModels,
    ...openrouterModels,
    ...groqModels,
    ...geminiModels,
  ];
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
    case 'openrouter':
      return openrouterProvider(model);
    case 'groq':
      return groqProvider(model);
    case 'gemini':
      return geminiProvider(model);
    default:
      return ollamaProvider(model);
  }
};
