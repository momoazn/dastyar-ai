import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { z } from 'zod';
import { type Model, type ModelProvider, ModelProviderEnum } from '@/db/schema';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

const OLLAMA_OPENAI_BASE_URL = 'http://localhost:11434/v1' as const;
const LMSTUDIO_OPENAI_BASE_URL = 'http://localhost:1234/v1' as const;
const OPENROUTER_BASE_URL = 'http://api.openrouter.ai/v1' as const;

export const ollamaProvider = createOpenAICompatible({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  name: 'ollama',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
});

export const openrouterProvider = createOpenAICompatible({
  baseURL: OPENROUTER_BASE_URL,
  name: 'openrouter',
  apiKey: parsedEnv.data?.OPENROUTER_API_KEY,
});

const fetchOpenAICompatibleModels = async (
  apiBase: string
): Promise<OpenAI.Models.Model[]> => {
  const client = new OpenAI({
    baseURL: apiBase,
  });
  const response = await client.models.list();
  return response.data;
};

export const listLmstudioModels = async () => {
  try {
    const models = await fetchOpenAICompatibleModels(LMSTUDIO_OPENAI_BASE_URL);
    return models;
  } catch {
    return [];
  }
};

export const listOllamaModels = async () => {
  try {
    const models = await fetchOpenAICompatibleModels(OLLAMA_OPENAI_BASE_URL);
    return models;
  } catch {
    return [];
  }
};

export const listOpenrouterModels = async () => {
  try {
    const models = await fetchOpenAICompatibleModels(OPENROUTER_BASE_URL);
    return models;
  } catch {
    return [];
  }
};

export const listAllModels = async (): Promise<
  (OpenAI.Models.Model & { provider: ModelProvider })[]
> => {
  const ollamaModels = await listOllamaModels();
  const lmstudioModels = await listLmstudioModels();
  const openrouterModels = await listOpenrouterModels();

  return [
    ...ollamaModels.map((m) => ({
      ...m,
      provider: ModelProviderEnum.OLLAMA,
    })),
    ...lmstudioModels.map((m) => ({
      ...m,
      provider: ModelProviderEnum.LMSTUDIO,
    })),
    ...openrouterModels.map((m) => ({
      ...m,
      provider: ModelProviderEnum.OPENROUTER,
    })),
  ];
};

export const getProviderForModel = (
  model: Model
): ReturnType<typeof ollamaProvider> => {
  switch (model.provider) {
    case ModelProviderEnum.OLLAMA:
      return ollamaProvider(model.name);
    case ModelProviderEnum.LMSTUDIO:
      return lmstudioProvider(model.name);
    case ModelProviderEnum.OPENROUTER:
      return openrouterProvider(model.name);
    default:
      return ollamaProvider(model.name);
  }
};
