import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import OpenAI from 'openai';
import { ModelProviderEnum } from './constants';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

export const OPENROUTER_MODELS = [
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'google/gemma-3n-e2b-it:free',
  'tencent/hunyuan-a13b-instruct:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'moonshotai/kimi-dev-72b:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1-0528:free',
  'microsoft/mai-ds-r1:free',
  'qwen/qwen2.5-vl-32b-instruct:free',
];

const OPENROUTER_BASE_URL = 'https://api.openrouter.ai/v1' as const;
const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
const ENABLE_OPENROUTER =
  (process.env.ENABLE_OPENROUTER ?? '').toLowerCase() !== 'false';

let cachedClient: OpenAI | null = null;
const getClient = (): OpenAI | null => {
  if (!OPENROUTER_API_KEY) {
    return null;
  }
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
  });
  return cachedClient;
};

export const openrouterProvider = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

export const listOpenrouterModels = async (): Promise<MinimalModel[]> => {
  if (!(ENABLE_OPENROUTER && OPENROUTER_API_KEY)) {
    return [];
  }
  try {
    const client = getClient();
    if (!client) {
      return [];
    }
    const models = await client.models.list();
    return models.data.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
};

export const openrouterFactories: ProviderFactoriesRegistry = {
  [ModelProviderEnum.OPENROUTER]: openrouterProvider,
};

export const openrouterListFns: ProviderListRegistry = {
  [ModelProviderEnum.OPENROUTER]: listOpenrouterModels,
};
