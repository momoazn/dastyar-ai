import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  TranslateButton,
  TranslationControls,
  TranslationTextAreas,
} from "@/components/translation";
import { useModelsList } from "@/hooks";
import { client } from "@/lib/hono";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { pb } from "@/lib/pocketbase";
import {
  TranslationsSourceLanguageOptions,
  TranslationsTargetLanguageOptions,
  TranslationsToneOptions,
} from "@/lib/pocketbase-types";

const languages: {
  value: TranslationsSourceLanguageOptions | TranslationsTargetLanguageOptions;
  label: string;
}[] = [
  {
    value: TranslationsSourceLanguageOptions.fa,
    label: PERSIAN_TEXTS.languages.persian,
  },
  {
    value: TranslationsSourceLanguageOptions.en,
    label: PERSIAN_TEXTS.languages.english,
  },
  {
    value: TranslationsSourceLanguageOptions.ar,
    label: PERSIAN_TEXTS.languages.arabic,
  },
  {
    value: TranslationsSourceLanguageOptions.fr,
    label: PERSIAN_TEXTS.languages.french,
  },
  {
    value: TranslationsSourceLanguageOptions.de,
    label: PERSIAN_TEXTS.languages.german,
  },
  {
    value: TranslationsSourceLanguageOptions.es,
    label: PERSIAN_TEXTS.languages.spanish,
  },
] as const;

const tones: {
  value: TranslationsToneOptions;
  label: string;
}[] = [
  { value: TranslationsToneOptions.formal, label: PERSIAN_TEXTS.tones.formal },
  {
    value: TranslationsToneOptions.informal,
    label: PERSIAN_TEXTS.tones.casual,
  },
  {
    value: TranslationsToneOptions.technical,
    label: PERSIAN_TEXTS.tones.technical,
  },
  {
    value: TranslationsToneOptions.friendly,
    label: PERSIAN_TEXTS.tones.friendly,
  },
  {
    value: TranslationsToneOptions.academic,
    label: PERSIAN_TEXTS.tones.academic,
  },
  {
    value: TranslationsToneOptions.business,
    label: PERSIAN_TEXTS.tones.business,
  },
  {
    value: TranslationsToneOptions.creative,
    label: PERSIAN_TEXTS.tones.creative,
  },
  {
    value: TranslationsToneOptions.neutral,
    label: PERSIAN_TEXTS.tones.neutral,
  },
] as const;

type Language = (typeof languages)[number]["value"];
type Tone = (typeof tones)[number]["value"];

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<Language>(
    TranslationsSourceLanguageOptions.en,
  );
  const [targetLanguage, setTargetLanguage] = useState<Language>(
    TranslationsTargetLanguageOptions.fa,
  );
  const [tone, setTone] = useState<Tone>(TranslationsToneOptions.formal);
  const [model, setModel] = useState<string>("");

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: models } = useModelsList();

  // Memoize the original translation data to detect changes
  const [originalTranslation, setOriginalTranslation] = useState<{
    sourceText: string;
    sourceLang: Language;
    targetLang: Language;
    tone: Tone;
    model: string;
  } | null>(null);

  // Check if current parameters differ from the original translation
  const hasParametersChanged = useMemo(() => {
    if (!originalTranslation) return false;

    return (
      sourceText !== originalTranslation.sourceText ||
      sourceLanguage !== originalTranslation.sourceLang ||
      targetLanguage !== originalTranslation.targetLang ||
      tone !== originalTranslation.tone ||
      model !== originalTranslation.model
    );
  }, [
    sourceText,
    sourceLanguage,
    targetLanguage,
    tone,
    model,
    originalTranslation,
  ]);

  const { mutate: createTranslation, isPending: isTranslating } = useMutation({
    mutationFn: async (): Promise<{
      translationId: string;
      translatedText: string;
    }> => {
      const response = await client.api.translation.$post({
        json: {
          sourceText,
          model,
          sourceLanguage: sourceLanguage as TranslationsSourceLanguageOptions,
          targetLanguage: targetLanguage as TranslationsTargetLanguageOptions,
          tone,
        },
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setTranslatedText(data.translatedText);
      navigate(`/translation/${data.translationId}`, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["translations"] });
    },
  });

  const { data: translation } = useQuery({
    queryKey: ["translation", id],
    queryFn: async () => {
      if (!id) return null;
      const translation = await pb.collection("translations").getOne(id);
      return translation;
    },
    enabled: Boolean(id),
  });

  // Load translation data when viewing an existing translation
  useEffect(() => {
    if (!translation) return;

    const loadedData = {
      sourceText: translation.sourceText || "",
      sourceLang: (translation.sourceLanguage as Language) || "en",
      targetLang: (translation.targetLanguage as Language) || "fa",
      tone: (translation.tone as Tone) || "formal",
      model: translation.model || "",
    };

    setSourceText(loadedData.sourceText);
    setTranslatedText(translation.translatedText || "");
    setSourceLanguage(loadedData.sourceLang);
    setTargetLanguage(loadedData.targetLang);
    setTone(loadedData.tone);
    setModel(loadedData.model);

    // Store original data to detect changes
    setOriginalTranslation(loadedData);
  }, [translation]);

  // Set default model when models are loaded
  useEffect(() => {
    if (!models || model) return;
    setModel(models.at(-1)?.name || "");
  }, [models, model]);

  // Clear translated text when parameters change (except when initially loading)
  useEffect(() => {
    if (hasParametersChanged && originalTranslation) {
      setTranslatedText("");
    }
  }, [hasParametersChanged, originalTranslation]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSourceTextChange = useCallback((text: string) => {
    setSourceText(text);
  }, []);

  const handleSourceLangChange = useCallback((value: string) => {
    setSourceLanguage(value as Language);
  }, []);

  const handleTargetLangChange = useCallback((value: string) => {
    setTargetLanguage(value as Language);
  }, []);

  const handleToneChange = useCallback((value: string) => {
    setTone(value as Tone);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setModel(value);
  }, []);

  const handleTranslate = useCallback(() => {
    if (!sourceText.trim()) return;
    createTranslation();
  }, [sourceText, createTranslation]);

  // Check if translation is ready
  const canTranslate = sourceText.trim() && model && !isTranslating;

  // Determine if this will create a new translation
  const willCreateNew = !id || hasParametersChanged;

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Header with controls */}
      <TranslationControls
        sourceLang={sourceLanguage}
        targetLang={targetLanguage}
        tone={tone}
        model={model}
        onSourceLangChange={handleSourceLangChange}
        onTargetLangChange={handleTargetLangChange}
        onToneChange={handleToneChange}
        onModelChange={handleModelChange}
        languages={languages}
        tones={tones}
        models={models ?? []}
        labels={{
          sourceLanguage: PERSIAN_TEXTS.translation.sourceLanguage,
          targetLanguage: PERSIAN_TEXTS.translation.targetLanguage,
          translationTone: PERSIAN_TEXTS.translation.translationTone,
          model: PERSIAN_TEXTS.translation.model,
        }}
      />

      {/* Main content area with text areas */}
      <div className="flex flex-1 flex-col p-4">
        <TranslationTextAreas
          sourceText={sourceText}
          translatedText={translatedText}
          isTranslating={isTranslating}
          onSourceTextChange={handleSourceTextChange}
          placeholders={{
            enterText: PERSIAN_TEXTS.translation.enterText,
            translatedText: willCreateNew
              ? PERSIAN_TEXTS.translation.translatedText
              : PERSIAN_TEXTS.translation.translatedText,
          }}
          loadingText={PERSIAN_TEXTS.translation.translating}
        />

        <TranslateButton
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          text={
            willCreateNew
              ? PERSIAN_TEXTS.translation.translate
              : PERSIAN_TEXTS.translation.retranslate
          }
          disabled={!canTranslate}
        />

        {/* Show indicator when parameters have changed */}
        {hasParametersChanged && originalTranslation && (
          <div className="mt-2 text-center">
            <span className="text-muted-foreground text-xs">
              {PERSIAN_TEXTS.translation.parametersChanged}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
