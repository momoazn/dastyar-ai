import { useCallback, useEffect, useState } from "react";

import {
  TranslateButton,
  TranslationControls,
  TranslationTextAreas,
} from "@/components/translation";
import { useModelsList } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { skipToken } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateTranslation,
  useGetTranslation,
  useGetTranslations,
} from "../../generated/apiComponents";

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
];

const tones = [
  { value: "formal", label: PERSIAN_TEXTS.tones.formal },
  { value: "casual", label: PERSIAN_TEXTS.tones.casual },
  { value: "technical", label: PERSIAN_TEXTS.tones.technical },
  { value: "friendly", label: PERSIAN_TEXTS.tones.friendly },
];

type Language = (typeof languages)[number]["value"];
type Tone = (typeof tones)[number]["value"];

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState<Language>("en");
  const [targetLang, setTargetLang] = useState<Language>("fa");
  const [tone, setTone] = useState<Tone>("formal");
  const [model, setModel] = useState<string>("");

  const { id } = useParams();
  const navigate = useNavigate();
  const isExistingTranslation = Boolean(id);

  const { data: ollamaModels } = useModelsList();
  const { refetch: refetchTranslations } = useGetTranslations({});
  const { data: translationResponse } = useGetTranslation(
    id ? { pathParams: { id } } : skipToken,
    {
      enabled: isExistingTranslation,
    },
  );
  const { mutate: createTranslation, isPending: isTranslating } =
    useCreateTranslation({
      onSuccess: ({ data }) => {
        refetchTranslations();
        navigate(`/translation/${data?.id}`);
        setTranslatedText(data?.translated_text || "");
      },
    });

  const translation = translationResponse?.data;

  useEffect(() => {
    if (!translation || !isExistingTranslation) return;
    setSourceText(translation.source_text || "");
    setTranslatedText(translation.translated_text || "");
    setSourceLang((translation.source_language as Language) || "en");
    setTargetLang((translation.target_language as Language) || "fa");
    setTone((translation.tone as Tone) || "formal");
    setModel(translation.model || "");
  }, [translation, isExistingTranslation]);

  useEffect(() => {
    if (!ollamaModels || model) return;
    setModel(ollamaModels.models?.at(-1)?.model || "");
  }, [ollamaModels]);

  const handleTranslate = useCallback(() => {
    createTranslation({
      body: {
        source_text: sourceText,
        model: model,
        source_language: sourceLang,
        target_language: targetLang,
        tone: tone,
      },
    });
  }, [sourceText, sourceLang, targetLang, tone, model, createTranslation]);

  const models = ollamaModels?.models || [];

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Header with controls */}
      <TranslationControls
        sourceLang={sourceLang}
        targetLang={targetLang}
        tone={tone}
        model={model}
        onSourceLangChange={setSourceLang}
        onTargetLangChange={setTargetLang}
        onToneChange={setTone}
        onModelChange={setModel}
        languages={languages}
        tones={tones}
        models={models}
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
          onSourceTextChange={setSourceText}
          placeholders={{
            enterText: PERSIAN_TEXTS.translation.enterText,
            translatedText: PERSIAN_TEXTS.translation.translatedText,
          }}
          loadingText={PERSIAN_TEXTS.translation.translating}
        />

        <TranslateButton
          onTranslate={handleTranslate}
          isTranslating={isTranslating}
          text={PERSIAN_TEXTS.translation.translate}
          disabled={!sourceText.trim()}
        />
      </div>
    </div>
  );
}
