import { useCallback, useEffect, useMemo, useState } from "react";

import {
  TranslateButton,
  TranslationControls,
  TranslationTextAreas,
} from "@/components/translation";
import { useModelsList } from "@/hooks";
import { client } from "@/lib/hono";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { pb } from "@/lib/pocketbase";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

const languages = [
  {
    value: "fa",
    label: PERSIAN_TEXTS.languages.persian,
    fullName: "Persian (Farsi)",
  },
  {
    value: "en",
    label: PERSIAN_TEXTS.languages.english,
    fullName: "English",
  },
  {
    value: "ar",
    label: PERSIAN_TEXTS.languages.arabic,
    fullName: "Modern Standard Arabic",
  },
  {
    value: "fr",
    label: PERSIAN_TEXTS.languages.french,
    fullName: "French",
  },
  {
    value: "de",
    label: PERSIAN_TEXTS.languages.german,
    fullName: "German",
  },
  {
    value: "es",
    label: PERSIAN_TEXTS.languages.spanish,
    fullName: "Spanish",
  },
] as const;

const tones = [
  { value: "formal", label: PERSIAN_TEXTS.tones.formal },
  { value: "casual", label: PERSIAN_TEXTS.tones.casual },
  { value: "technical", label: PERSIAN_TEXTS.tones.technical },
  { value: "friendly", label: PERSIAN_TEXTS.tones.friendly },
] as const;

type Language = (typeof languages)[number]["value"];
type Tone = (typeof tones)[number]["value"];

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<Language>("en");
  const [targetLanguage, setTargetLanguage] = useState<Language>("fa");
  const [tone, setTone] = useState<Tone>("formal");
  const [model, setModel] = useState<string>("");

  const { id } = useParams();
  const navigate = useNavigate();

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
    mutationFn: async (): Promise<void> => {
      const response = await client.api.translation.$post({
        json: {
          sourceText,
          model,
          sourceLanguage,
          targetLanguage,
          tone,
        },
      });
      const data = await response.json();
      setTranslatedText(data.translatedText);
      navigate(`/translation/${data.translationId}`, { replace: true });
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
      sourceText: translation.source_text || "",
      sourceLang: (translation.source_language as Language) || "en",
      targetLang: (translation.target_language as Language) || "fa",
      tone: (translation.tone as Tone) || "formal",
      model: translation.model || "",
    };

    setSourceText(loadedData.sourceText);
    setTranslatedText(translation.translated_text || "");
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
        languages={
          languages as unknown as {
            value: string;
            label: string;
            fullName: string;
          }[]
        }
        tones={tones as unknown as { value: string; label: string }[]}
        models={models || []}
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
