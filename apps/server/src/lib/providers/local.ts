import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { ModelProviderEnum } from '@/db/schema';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

const OLLAMA_OPENAI_BASE_URL = 'http://localhost:11434/v1' as const;
const LMSTUDIO_OPENAI_BASE_URL = 'http://localhost:1234/v1' as const;

export const ollamaClient = new OpenAI({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  apiKey: 'ollama',
});

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: 'lmstudio',
});

export const ollamaProvider = createOpenAICompatible({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  name: 'ollama',
  apiKey: 'ollama',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
  apiKey: 'lmstudio',
});

const safeListModels = async (
  client: OpenAI | null
): Promise<MinimalModel[]> => {
  if (!client) {
    return [];
  }
  try {
    const models = await client.models.list();
    return models.data.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
};

export const listOllamaModels = (): Promise<MinimalModel[]> =>
  safeListModels(ollamaClient);

export const listLmstudioModels = (): Promise<MinimalModel[]> =>
  safeListModels(lmstudioClient);

export const localFactories: ProviderFactoriesRegistry = {
  [ModelProviderEnum.OLLAMA]: ollamaProvider,
  [ModelProviderEnum.LMSTUDIO]: lmstudioProvider,
};

export const localListFns: ProviderListRegistry = {
  [ModelProviderEnum.OLLAMA]: listOllamaModels,
  [ModelProviderEnum.LMSTUDIO]: listLmstudioModels,
};
