import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  TranslationControls,
  TranslationTextAreas,
  TranslateButton,
} from "@/components/translation";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

export const Route = createFileRoute("/translation")({
  component: TranslationRouteComponent,
});

function TranslationRouteComponent() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("fa");
  const [tone, setTone] = useState("formal");
  const [model, setModel] = useState("");

  // ===== MOCK DATA =====
  const languages = [
    { value: "fa", label: PERSIAN_TEXTS.languages.persian },
    { value: "en", label: PERSIAN_TEXTS.languages.english },
    { value: "ar", label: PERSIAN_TEXTS.languages.arabic },
    { value: "fr", label: PERSIAN_TEXTS.languages.french },
    { value: "de", label: PERSIAN_TEXTS.languages.german },
    { value: "es", label: PERSIAN_TEXTS.languages.spanish },
  ];

  const tones = [
    { value: "formal", label: PERSIAN_TEXTS.tones.formal },
    { value: "casual", label: PERSIAN_TEXTS.tones.casual },
    { value: "technical", label: PERSIAN_TEXTS.tones.technical },
    { value: "friendly", label: PERSIAN_TEXTS.tones.friendly },
    { value: "academic", label: PERSIAN_TEXTS.tones.academic },
    { value: "business", label: PERSIAN_TEXTS.tones.business },
    { value: "creative", label: PERSIAN_TEXTS.tones.creative },
    { value: "neutral", label: PERSIAN_TEXTS.tones.neutral },
  ];

  const models = [
    { model: "llama3.2", name: "Llama 3.2" },
    { model: "mistral", name: "Mistral" },
    { model: "gemma", name: "Gemma" },
  ];

  // ===== STATE =====
  const [isTranslating, setIsTranslating] = useState(false);
  const [originalTranslation, setOriginalTranslation] = useState<{
    sourceText: string;
    sourceLang: string;
    targetLang: string;
    tone: string;
    model: string;
  } | null>(null);

  // ===== DERIVED STATE =====
  const hasParametersChanged = useMemo(() => {
    if (!originalTranslation) return false;

    return (
      sourceText !== originalTranslation.sourceText ||
      sourceLanguage !== originalTranslation.sourceLang ||
      targetLanguage !== originalTranslation.targetLang ||
      tone !== originalTranslation.tone ||
      model !== originalTranslation.model
    );
  }, [sourceText, sourceLanguage, targetLanguage, tone, model, originalTranslation]);

  // ===== EFFECTS =====
  useEffect(() => {
    if (!models || model) return;
    setModel(models[0]?.model || "");
  }, [models, model]);

  useEffect(() => {
    if (hasParametersChanged && originalTranslation) {
      setTranslatedText("");
    }
  }, [hasParametersChanged, originalTranslation]);

  // ===== HANDLERS =====
  const handleSourceTextChange = useCallback((text: string) => {
    setSourceText(text);
  }, []);

  const handleSourceLangChange = useCallback((value: string) => {
    setSourceLanguage(value);
  }, []);

  const handleTargetLangChange = useCallback((value: string) => {
    setTargetLanguage(value);
  }, []);

  const handleToneChange = useCallback((value: string) => {
    setTone(value);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setModel(value);
  }, []);

  const handleTranslate = useCallback(() => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    
    // Simulate translation
    setTimeout(() => {
      setTranslatedText(`Translated: ${sourceText}`);
      setIsTranslating(false);
      
      // Store original data
      setOriginalTranslation({
        sourceText,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        tone,
        model,
      });
    }, 2000);
  }, [sourceText, sourceLanguage, targetLanguage, tone, model]);

  // ===== DERIVED VALUES =====
  const canTranslate = sourceText.trim() && model && !isTranslating;
  const willCreateNew = !originalTranslation || hasParametersChanged;

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
          onSourceTextChange={handleSourceTextChange}
          placeholders={{
            enterText: PERSIAN_TEXTS.translation.enterText,
            translatedText: PERSIAN_TEXTS.translation.translatedText,
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


