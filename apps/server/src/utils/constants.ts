export const codeToLanguageMap = {
  fa: 'Farsi',
  en: 'English',
  ar: 'Arabic',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  hi: 'Hindi',
  ur: 'Urdu',
} as const;

export type LanguageCode = keyof typeof codeToLanguageMap;

export const codeToLanguage = (code: LanguageCode): string => {
  return codeToLanguageMap[code] || code;
};

export const toneToLabelMap = {
  formal: 'Formal',
  informal: 'Informal',
  business: 'Business',
  casual: 'Casual',
  academic: 'Academic',
  technical: 'Technical',
  creative: 'Creative',
  friendly: 'Friendly',
  professional: 'Professional',
} as const;

export type Tone = keyof typeof toneToLabelMap;

export const toneToLabel = (tone: Tone): string => {
  return toneToLabelMap[tone] || tone;
};
