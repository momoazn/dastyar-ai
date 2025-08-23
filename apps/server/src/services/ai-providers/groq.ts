import { createGroq } from '@ai-sdk/groq';
import { Groq } from 'groq-sdk';
import { ModelProviderEnum } from './constants';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

export const GROQ_MODELS = [
  'gemma2-9b-it',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-guard-4-12b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'deepseek-r1-distill-llama-70b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-prompt-guard-2-22m',
  'meta-llama/llama-prompt-guard-2-86m',
  'mistral-saba-24b',
  'moonshotai/kimi-k2-instruct',
  'qwen/qwen3-32b',
  'llama-guard-3-8b',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'qwen-qwq-32b',
  'qwen-2.5-32b',
  'deepseek-r1-distill-qwen-32b',
] as const;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const ENABLE_GROQ = (process.env.ENABLE_GROQ ?? '').toLowerCase() !== 'false';

const groqClient = new Groq({ apiKey: GROQ_API_KEY });

export const groqProvider = createGroq({ apiKey: GROQ_API_KEY });

export const listGroqModels = async (): Promise<MinimalModel[]> => {
  if (!(ENABLE_GROQ && GROQ_API_KEY)) {
    return [];
  }
  try {
    const res = await groqClient.models.list();
    return res.data.map((m) => ({ id: m.id }));
  } catch {
    return [];
  }
};

export const groqFactories: ProviderFactoriesRegistry = {
  [ModelProviderEnum.GROQ]: groqProvider,
};

export const groqListFns: ProviderListRegistry = {
  [ModelProviderEnum.GROQ]: listGroqModels,
};

groqProvider('');
