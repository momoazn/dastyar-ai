import { fa } from '@/lib/persian-texts';
import type { client } from '@/utils/orpc';

export type TranslateInput = Parameters<
  typeof client.translations.translate
>[0];
export type LanguageCode = TranslateInput['sourceLanguage'];
export type ToneOption = NonNullable<TranslateInput['tone']>;

export const languages: Array<{ value: LanguageCode; label: string }> = [
  { value: 'fa', label: fa.languages.persian },
  { value: 'en', label: fa.languages.english },
  { value: 'ar', label: fa.languages.arabic },
  { value: 'fr', label: fa.languages.french },
  { value: 'de', label: fa.languages.german },
  { value: 'es', label: fa.languages.spanish },
];

export const tones: Array<{ value: ToneOption; label: string }> = [
  { value: 'formal', label: fa.tones.formal },
  { value: 'casual', label: fa.tones.casual },
  { value: 'technical', label: fa.tones.technical },
  { value: 'friendly', label: fa.tones.friendly },
  { value: 'academic', label: fa.tones.academic },
  { value: 'business', label: fa.tones.business },
  { value: 'creative', label: fa.tones.creative },
  { value: 'professional', label: fa.tones.professional },
];
