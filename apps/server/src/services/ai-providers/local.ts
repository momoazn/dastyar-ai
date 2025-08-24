import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import {
  getAiProviderApiKey,
  getAiProviderBaseUrl,
  type MinimalModel,
  ModelProviderEnum,
  type ProviderFactoriesRegistry,
  type ProviderListRegistry,
} from '../../config';

const OLLAMA_OPENAI_BASE_URL =
  getAiProviderBaseUrl(ModelProviderEnum.OLLAMA) || 'http://localhost:11434/v1';
const LMSTUDIO_OPENAI_BASE_URL =
  getAiProviderBaseUrl(ModelProviderEnum.LMSTUDIO) ||
  'http://localhost:1234/v1';

export const ollamaClient = new OpenAI({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  apiKey: getAiProviderApiKey(ModelProviderEnum.OLLAMA) || 'ollama',
});

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: getAiProviderApiKey(ModelProviderEnum.LMSTUDIO) || 'lmstudio',
});

export const ollamaProvider = createOpenAICompatible({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  name: 'ollama',
  apiKey: getAiProviderApiKey(ModelProviderEnum.OLLAMA) || 'ollama',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
  apiKey: getAiProviderApiKey(ModelProviderEnum.LMSTUDIO) || 'lmstudio',
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
