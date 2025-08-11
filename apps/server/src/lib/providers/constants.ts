export const ModelProviderEnum = {
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
} as const;

export type ModelProvider =
  (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum];
