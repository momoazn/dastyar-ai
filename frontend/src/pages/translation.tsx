import { useCallback, useEffect, useState } from "react";

import {
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useTranslate } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { useParams } from "react-router-dom";
import { useGetTranslation } from "../../generated/apiComponents";
import { skipToken } from "@tanstack/react-query";

const languages = [
  {
    value: "persian",
    label: PERSIAN_TEXTS.languages.persian,
    fullName: "Persian (Farsi)",
  },
  {
    value: "english",
    label: PERSIAN_TEXTS.languages.english,
    fullName: "English",
  },
  {
    value: "arabic",
    label: PERSIAN_TEXTS.languages.arabic,
    fullName: "Modern Standard Arabic",
  },
  {
    value: "french",
    label: PERSIAN_TEXTS.languages.french,
    fullName: "French",
  },
  {
    value: "german",
    label: PERSIAN_TEXTS.languages.german,
    fullName: "German",
  },
  {
    value: "spanish",
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
  const [sourceLang, setSourceLang] = useState<Language>("english");
  const [targetLang, setTargetLang] = useState<Language>("persian");
  const [tone, setTone] = useState<Tone>("formal");

  const { id } = useParams();

  const { data: translationResponse } = useGetTranslation(
    id ? { pathParams: { id } } : skipToken,
    {
      enabled: Boolean(id),
    }
  );
  
  const translation = translationResponse?.data;

  useEffect(() => {
    if (translation) {
      console.log("=========> translation", translation);

      setSourceText(translation.source_text || "");
      setTranslatedText(translation.translated_text || "");
      setSourceLang((translation.source_language as Language) || "english");
      setTargetLang((translation.target_language as Language) || "persian");
      setTone((translation.tone as Tone) || "formal");
    }
  }, [translation]);

  const { translate, isTranslating } = useTranslate();

  const handleTranslate = useCallback(async () => {
    if (!sourceText) return;

    try {
      const result = await translate(sourceText, {
        sourceLang: sourceLang,
        targetLang: targetLang,
        tone: tone,
      });

      setTranslatedText(result);
    } catch (error) {
      if (error instanceof Error) {
        setTranslatedText(
          `${PERSIAN_TEXTS.translation.error}: ${error.message}`,
        );
      } else {
        setTranslatedText(
          `${PERSIAN_TEXTS.translation.error}. ${PERSIAN_TEXTS.translation.tryAgain}`,
        );
      }
    }
  }, [sourceText, sourceLang, targetLang, tone, translate]);

  // Auto-translate when source text changes (with debounce)
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }

    const timeoutId = setTimeout(() => {
      handleTranslate();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [sourceText, sourceLang, targetLang, tone, handleTranslate]);

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Header with controls */}
      <div className="bg-background p-4">
        <div className="w-full">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {PERSIAN_TEXTS.translation.sourceLanguage}
              </label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="text-right"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {PERSIAN_TEXTS.translation.targetLanguage}
              </label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="text-right"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {PERSIAN_TEXTS.translation.translationTone}
              </label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {tones.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-right"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area with text areas */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex h-full w-full flex-col gap-4">
          {/* Input text area */}
          <Card className="flex-1 p-4">
            <div className="h-full">
              <Textarea
                placeholder={PERSIAN_TEXTS.translation.enterText}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
              />
            </div>
          </Card>

          {/* Translated text area */}
          <Card className="flex-1 p-4">
            <div className="h-full">
              {isTranslating ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-muted-foreground">
                    {PERSIAN_TEXTS.translation.translating}...
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder={PERSIAN_TEXTS.translation.translatedText}
                  value={translatedText}
                  readOnly
                  className="h-full min-h-[200px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
