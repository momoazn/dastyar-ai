import { PERSIAN_TEXTS } from '@/lib/persian-texts';
import type { client } from '@/utils/orpc';

export type TranslateInput = Parameters<
  typeof client.translations.translate
>[0];
export type LanguageCode = TranslateInput['sourceLanguage'];
export type ToneOption = NonNullable<TranslateInput['tone']>;

export const languages: Array<{ value: LanguageCode; label: string }> = [
  { value: 'fa', label: PERSIAN_TEXTS.languages.persian },
  { value: 'en', label: PERSIAN_TEXTS.languages.english },
  { value: 'ar', label: PERSIAN_TEXTS.languages.arabic },
  { value: 'fr', label: PERSIAN_TEXTS.languages.french },
  { value: 'de', label: PERSIAN_TEXTS.languages.german },
  { value: 'es', label: PERSIAN_TEXTS.languages.spanish },
];

export const tones: Array<{ value: ToneOption; label: string }> = [
  { value: 'formal', label: PERSIAN_TEXTS.tones.formal },
  { value: 'casual', label: PERSIAN_TEXTS.tones.casual },
  { value: 'technical', label: PERSIAN_TEXTS.tones.technical },
  { value: 'friendly', label: PERSIAN_TEXTS.tones.friendly },
  { value: 'academic', label: PERSIAN_TEXTS.tones.academic },
  { value: 'business', label: PERSIAN_TEXTS.tones.business },
  { value: 'creative', label: PERSIAN_TEXTS.tones.creative },
  { value: 'professional', label: PERSIAN_TEXTS.tones.professional },
];
