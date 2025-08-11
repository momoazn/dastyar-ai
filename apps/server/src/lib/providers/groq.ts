import { createGroq } from '@ai-sdk/groq';
import { Groq } from 'groq-sdk';
import { ModelProviderEnum } from '@/db/schema';
import type {
  MinimalModel,
  ProviderFactoriesRegistry,
  ProviderListRegistry,
} from './types';

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
