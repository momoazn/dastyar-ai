import { Selector } from "./selector";

interface Language {
  value: string;
  label: string;
  fullName: string;
}

interface Tone {
  value: string;
  label: string;
}

interface Model {
  model: string;
  name?: string;
}

interface TranslationControlsProps {
  sourceLang: string;
  targetLang: string;
  tone: string;
  model: string;
  onSourceLangChange: (value: string) => void;
  onTargetLangChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onModelChange: (value: string) => void;
  languages: Language[];
  tones: Tone[];
  models: Model[];
  labels: {
    sourceLanguage: string;
    targetLanguage: string;
    translationTone: string;
    model: string;
  };
}

export function TranslationControls({
  sourceLang,
  targetLang,
  tone,
  model,
  onSourceLangChange,
  onTargetLangChange,
  onToneChange,
  onModelChange,
  languages,
  tones,
  models,
  labels,
}: TranslationControlsProps) {
  const languageOptions = languages.map((lang) => ({
    value: lang.value,
    label: lang.label,
  }));

  const toneOptions = tones.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const modelOptions = models.map((m) => ({
    value: m.model,
    label: m.name || m.model,
  }));

  return (
    <div className="bg-background p-4">
      <div className="w-full">
        <div className="grid grid-cols-4 gap-4">
          <Selector
            label={labels.sourceLanguage}
            value={sourceLang}
            onChange={onSourceLangChange}
            options={languageOptions}
          />

          <Selector
            label={labels.targetLanguage}
            value={targetLang}
            onChange={onTargetLangChange}
            options={languageOptions}
          />

          <Selector
            label={labels.translationTone}
            value={tone}
            onChange={onToneChange}
            options={toneOptions}
          />

          <Selector
            label={labels.model}
            value={model}
            onChange={onModelChange}
            options={modelOptions}
          />
        </div>
      </div>
    </div>
  );
}
