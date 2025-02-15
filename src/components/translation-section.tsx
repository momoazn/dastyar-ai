import { useModelSelection } from "@/hooks/use-model-selection";
import { useState } from "react";
import { useTranslation } from "../hooks/use-translation";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

const languages = [
  { value: "Persian", label: "فارسی" },
  { value: "English", label: "English" },
  { value: "Arabic", label: "العربية" },
  { value: "French", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
];

const tones = [
  { value: "formal", label: "رسمی" },
  { value: "casual", label: "غیر رسمی" },
  { value: "technical", label: "تخصصی" },
  { value: "friendly", label: "دوستانه" },
];

export function TranslationSection() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Persian");
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
        setTranslatedText(`خطا در ترجمه: ${error.message}`);
      } else {
        setTranslatedText("خطا در ترجمه. لطفا دوباره تلاش کنید.");
      }
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card className="flex-1 bg-background p-4">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">زبان مبدا</p>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue placeholder="زبان مبدا" />
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
            <p className="text-sm text-muted-foreground">زبان مقصد</p>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue placeholder="زبان مقصد" />
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
            <p className="text-sm text-muted-foreground">لحن ترجمه</p>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="لحن ترجمه" />
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
              placeholder="متن مورد نظر برای ترجمه را وارد کنید..."
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
            {isTranslating ? "در حال ترجمه..." : "ترجمه"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
