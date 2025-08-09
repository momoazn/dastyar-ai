import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import OpenAI from 'openai';
import { type Model, ModelProviderEnum } from '@/db/schema';

const OLLAMA_OPENAI_BASE_URL = 'http://localhost:11434/v1' as const;
const LMSTUDIO_OPENAI_BASE_URL = 'http://localhost:1234/v1' as const;
const OPENROUTER_BASE_URL = 'https://api.openrouter.ai/v1' as const;

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';

export const ollamaClient = new OpenAI({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  apiKey: 'ollama',
});

export const ollamaProvider = createOpenAICompatible({
  baseURL: OLLAMA_OPENAI_BASE_URL,
  name: 'ollama',
  apiKey: 'ollama',
});

export const lmstudioClient = new OpenAI({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  apiKey: 'lmstudio',
});

export const lmstudioProvider = createOpenAICompatible({
  baseURL: LMSTUDIO_OPENAI_BASE_URL,
  name: 'lmstudio',
  apiKey: 'lmstudio',
});

let cachedOpenrouterClient: OpenAI | null = null;
const getOpenrouterClient = (): OpenAI | null => {
  if (!OPENROUTER_API_KEY) {
    return null;
  }
  if (cachedOpenrouterClient) {
    return cachedOpenrouterClient;
  }
  cachedOpenrouterClient = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
  });
  return cachedOpenrouterClient;
};

export const openrouterProvider = createOpenAICompatible({
  baseURL: OPENROUTER_BASE_URL,
  name: 'openrouter',
  apiKey: OPENROUTER_API_KEY,
});

type OpenAIModelsData = Awaited<ReturnType<OpenAI['models']['list']>>['data'];

const safeListModels = async (
  client: OpenAI | null
): Promise<OpenAIModelsData> => {
  if (!client) {
    return [];
  }
  try {
    const models = await client.models.list();
    return models.data;
  } catch {
    return [];
  }
};

export const listLmstudioModels = () => safeListModels(lmstudioClient);

export const listOllamaModels = () => safeListModels(ollamaClient);

export const listOpenrouterModels = () => safeListModels(getOpenrouterClient());

export const listAllModels = async () => {
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
  const providers = {
    [ModelProviderEnum.OLLAMA]: ollamaProvider,
    [ModelProviderEnum.LMSTUDIO]: lmstudioProvider,
    [ModelProviderEnum.OPENROUTER]: openrouterProvider,
  } as const;
  type ProviderKey = keyof typeof providers;
  const key: ProviderKey = (
    Object.hasOwn(providers, model.provider)
      ? (model.provider as ProviderKey)
      : ModelProviderEnum.OLLAMA
  ) as ProviderKey;
  return providers[key](model.name);
};
