import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  Button,
  Card,
  LoadingSpinner,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useTranslation } from "@/hooks";
import {
  useCreateTranslationProject,
  useTranslationProjectTranslations,
} from "@/lib/api/translate";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

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

const getToneLabel = (tone: Tone) => {
  return tones.find((t) => t.value === tone)?.label || tone;
};

const getLanguageLabel = (language: Language) => {
  return languages.find((l) => l.value === language)?.label || language;
};

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState<Language>("english");
  const [targetLang, setTargetLang] = useState<Language>("persian");
  const [tone, setTone] = useState<Tone>("formal");

  const { translate, isTranslating } = useTranslation();

  const { projectId } = useParams();

  const {
    data: translations,
    isLoading: isTranslationsLoading,
    refetch: refetchTranslations,
  } = useTranslationProjectTranslations(Number(projectId), {
    enabled: !!projectId,
  });

  const { mutateAsync: createTranslationProject } =
    useCreateTranslationProject();

  const handleTranslate = async () => {
    if (!sourceText) return;

    let tId = Number(projectId);

    if (!tId) {
      const { data: newTranslationProject } = await createTranslationProject({
        title: PERSIAN_TEXTS.navigation.newChat,
      });
      tId = newTranslationProject.id;
    }

    try {
      const result = await translate(sourceText, tId, {
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
      <Card className="bg-background p-4">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
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
            <p className="text-muted-foreground text-sm">
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
            <p className="text-muted-foreground text-sm">
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

        <div className="mb-4 grid grid-cols-2 gap-6">
          <div>
            <Textarea
              placeholder={PERSIAN_TEXTS.translation.enterText}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[250px] w-full"
            />
          </div>
          <div>
            <Textarea
              placeholder={PERSIAN_TEXTS.translation.translatedText}
              value={translatedText}
              readOnly
              className="min-h-[250px] w-full"
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

      <Card className="bg-background flex-1 p-4">
        <h3 className="text-md text-muted-foreground mb-4 font-medium">
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
                  className="border-border bg-card rounded-lg border p-4 shadow-xs"
                >
                  <div className="text-muted-foreground mb-2 flex flex-row-reverse items-center justify-between text-sm">
                    <div className="rtl flex items-center gap-2">
                      <span>
                        {getLanguageLabel(translation.source_language)}
                      </span>
                      <span>←</span>
                      <span>
                        {getLanguageLabel(translation.target_language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>
                        {new Date(translation.created_at).toLocaleString()}
                      </span>
                      <span className="bg-secondary rounded-full px-2 py-0.5 text-xs">
                        {getToneLabel(translation.tone)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <p
                      dir="auto"
                      className="bg-muted rounded-md p-2 text-sm whitespace-pre-wrap"
                    >
                      {translation.source_text}
                    </p>
                    <p
                      dir="auto"
                      className="bg-muted rounded-md p-2 text-sm whitespace-pre-wrap"
                    >
                      {translation.translated_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            {PERSIAN_TEXTS.translation.noTranslations}
          </div>
        )}
      </Card>
    </div>
  );
}
