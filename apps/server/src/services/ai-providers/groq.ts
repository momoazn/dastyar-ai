import { createGroq } from '@ai-sdk/groq';
import { Groq } from 'groq-sdk';
import {
  getAiProviderApiKey,
  isAiProviderEnabled,
  type MinimalModel,
  ModelProviderEnum,
  type ProviderFactoriesRegistry,
  type ProviderListRegistry,
} from '../../config';

const GROQ_API_KEY = getAiProviderApiKey(ModelProviderEnum.GROQ) || '';
const ENABLE_GROQ = isAiProviderEnabled(ModelProviderEnum.GROQ);

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
