import { useModelSelection } from "@/hooks/use-model-selection";
import { useState } from "react";
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
import { PERSIAN_TEXTS } from "@/lib/persian-texts";

const languages = [
  { value: "persian", label: PERSIAN_TEXTS.languages.persian, fullName: "Persian (Farsi)" },
  { value: "english", label: PERSIAN_TEXTS.languages.english, fullName: "English" },
  { value: "arabic", label: PERSIAN_TEXTS.languages.arabic, fullName: "Modern Standard Arabic" },
  { value: "french", label: PERSIAN_TEXTS.languages.french, fullName: "French" },
  { value: "german", label: PERSIAN_TEXTS.languages.german, fullName: "German" },
  { value: "spanish", label: PERSIAN_TEXTS.languages.spanish, fullName: "Spanish" },
];

const tones = [
  { value: "formal", label: PERSIAN_TEXTS.tones.formal },
  { value: "casual", label: PERSIAN_TEXTS.tones.casual },
  { value: "technical", label: PERSIAN_TEXTS.tones.technical },
  { value: "friendly", label: PERSIAN_TEXTS.tones.friendly },
];

export function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("english");
  const [targetLang, setTargetLang] = useState("persian");
  const [tone, setTone] = useState("formal");

  const { selectedOllamaModel } = useModelSelection();
  const { translate, isTranslating } = useTranslation();

  const handleTranslate = async () => {
    if (!sourceText) return;

    try {
      const result = await translate(
        sourceText,
        {
          sourceLang,
          targetLang,
          tone,
        },
        selectedOllamaModel,
      );

      setTranslatedText(result);
    } catch (error) {
      if (error instanceof Error) {
        setTranslatedText(`${PERSIAN_TEXTS.translation.error}: ${error.message}`);
      } else {
        setTranslatedText(`${PERSIAN_TEXTS.translation.error}. ${PERSIAN_TEXTS.translation.tryAgain}`);
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card className="flex-1 bg-background p-4">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{PERSIAN_TEXTS.translation.sourceLanguage}</p>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue placeholder={PERSIAN_TEXTS.translation.sourceLanguage} />
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
            <p className="text-sm text-muted-foreground">{PERSIAN_TEXTS.translation.targetLanguage}</p>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue placeholder={PERSIAN_TEXTS.translation.targetLanguage} />
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
            <p className="text-sm text-muted-foreground">{PERSIAN_TEXTS.translation.translationTone}</p>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder={PERSIAN_TEXTS.translation.translationTone} />
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
              placeholder="ترجمه..."
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
            {isTranslating ? PERSIAN_TEXTS.translation.translating : PERSIAN_TEXTS.translation.translate}
          </Button>
        </div>
      </Card>
    </div>
  );
}
