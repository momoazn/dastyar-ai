import { useState } from "react";
import { useParams } from "react-router-dom";

import { useGetSelectedChatModel } from "@/atoms";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useTranslation } from "../hooks/use-translation";
import { useThreadTranslations } from "@/lib/api/chat";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const getToneLabel = (tone: string) => {
  console.log("##### tone", tone);

  return tones.find((t) => t.value === tone)?.label || tone;
};

const getLanguageLabel = (language: string) => {
  return languages.find((l) => l.value === language)?.label || language;
};

export function TranslationPage() {
  const { threadID } = useParams();

  const {
    data: translations,
    isLoading: isTranslationsLoading,
    refetch: refetchTranslations,
  } = useThreadTranslations(Number(threadID));

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("english");
  const [targetLang, setTargetLang] = useState("persian");
  const [tone, setTone] = useState("formal");

  const { translate, isTranslating } = useTranslation(Number(threadID));

  const selectedModel = useGetSelectedChatModel();

  const handleTranslate = async () => {
    if (!sourceText) return;

    try {
      const result = await translate(sourceText, selectedModel, {
        sourceLang,
        targetLang,
        tone,
      });

      setTranslatedText(result);
      refetchTranslations();
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
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card className="flex-1 bg-background p-4">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {PERSIAN_TEXTS.translation.sourceLanguage}
            </p>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue
                  placeholder={PERSIAN_TEXTS.translation.sourceLanguage}
                />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {PERSIAN_TEXTS.translation.targetLanguage}
            </p>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue
                  placeholder={PERSIAN_TEXTS.translation.targetLanguage}
                />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {PERSIAN_TEXTS.translation.translationTone}
            </p>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue
                  placeholder={PERSIAN_TEXTS.translation.translationTone}
                />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4 grid grid-rows-2 gap-6">
          <div>
            <Textarea
              placeholder={PERSIAN_TEXTS.translation.enterText}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[250px]"
            />
          </div>
          <div>
            <Textarea
              placeholder={PERSIAN_TEXTS.translation.translatedText}
              value={translatedText}
              readOnly
              className="min-h-[250px]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleTranslate}
            disabled={!sourceText || isTranslating}
          >
            {isTranslating
              ? PERSIAN_TEXTS.translation.translating
              : PERSIAN_TEXTS.translation.translate}
          </Button>
        </div>
      </Card>

      <Card className="flex-1 bg-background p-4">
        <h3 className="text-md mb-4 font-medium text-muted-foreground">
          {PERSIAN_TEXTS.translation.translations}
        </h3>

        {isTranslationsLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : translations?.data && translations.data.length > 0 ? (
          <ScrollArea className="h-[calc(100%-2rem)]">
            <div className="space-y-4">
              {translations.data.map((translation) => (
                <div
                  key={translation.id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex flex-row-reverse items-center justify-between text-sm text-muted-foreground">
                    <div className="rtl flex items-center gap-2">
                      <span>{getLanguageLabel(translation.source_lang)}</span>
                      <span>←</span>
                      <span>{getLanguageLabel(translation.target_lang)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        {new Date(translation.timestamp).toLocaleString()}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {getToneLabel(translation.tone)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <p
                      dir="auto"
                      className="whitespace-pre-wrap rounded-md bg-muted p-2 text-sm"
                    >
                      {translation.input}
                    </p>
                    <p
                      dir="auto"
                      className="whitespace-pre-wrap rounded-md bg-muted p-2 text-sm"
                    >
                      {translation.output}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {PERSIAN_TEXTS.translation.noTranslations}
          </div>
        )}
      </Card>
    </div>
  );
}
