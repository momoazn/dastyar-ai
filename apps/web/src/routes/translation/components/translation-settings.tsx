import { ArrowLeftRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLanguageOptions, createToneOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import type { LanguageCode, Tone } from "@/server/database/schema";
import type { SelectLlmModel } from "@/types/database";

const languageOptions = createLanguageOptions();
const toneOptions = createToneOptions();

type TranslationSettingsProps = {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  tone: Tone;
  modelId: number | null;
  models: SelectLlmModel[] | undefined;
  isModelsLoading: boolean;
  isTranslating: boolean;
  onSourceLanguageChange: (lang: LanguageCode) => void;
  onTargetLanguageChange: (lang: LanguageCode) => void;
  onToneChange: (tone: Tone) => void;
  onModelChange: (modelId: number) => void;
  onSwapLanguages: () => void;
};

export function TranslationSettings({
  sourceLanguage,
  targetLanguage,
  tone,
  modelId,
  models,
  isModelsLoading,
  isTranslating,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onToneChange,
  onModelChange,
  onSwapLanguages,
}: TranslationSettingsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm">
          {fa.translation.sourceLanguage}
        </div>
        <Select
          disabled={isTranslating}
          onValueChange={(v) => onSourceLanguageChange(v as LanguageCode)}
          value={sourceLanguage}
        >
          <SelectTrigger className="w-full text-right" dir="rtl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {languageOptions.map((lang) => (
              <SelectItem
                className="text-right"
                key={lang.value}
                value={lang.value}
              >
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm">
          {fa.translation.targetLanguage}
        </div>
        <Select
          disabled={isTranslating}
          onValueChange={(v) => onTargetLanguageChange(v as LanguageCode)}
          value={targetLanguage}
        >
          <SelectTrigger className="w-full text-right" dir="rtl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {languageOptions.map((lang) => (
              <SelectItem
                className="text-right"
                key={lang.value}
                value={lang.value}
              >
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm">
          {fa.translation.translationTone}
        </div>
        <Select
          disabled={isTranslating}
          onValueChange={(v) => onToneChange(v as Tone)}
          value={tone}
        >
          <SelectTrigger className="w-full text-right" dir="rtl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {toneOptions.map((t) => (
              <SelectItem className="text-right" key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="font-medium text-sm">{fa.translation.model}</div>
        <Select
          disabled={isTranslating || isModelsLoading}
          onValueChange={(value) => onModelChange(Number(value))}
          value={modelId?.toString()}
        >
          <SelectTrigger className="w-full text-right" dir="rtl">
            <SelectValue
              placeholder={
                isModelsLoading
                  ? fa.general.loadingModels
                  : fa.general.selectModel
              }
            />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {models?.map((m) => (
              <SelectItem
                className="text-right"
                key={m.id}
                value={m.id.toString()}
              >
                {m.identifier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end">
        <Button
          className="w-full gap-2"
          disabled={isTranslating}
          onClick={onSwapLanguages}
          type="button"
          variant="outline"
        >
          <ArrowLeftRightIcon className="h-4 w-4" />
          <span className="text-sm">
            {fa.translation.sourceLanguage} ↔ {fa.translation.targetLanguage}
          </span>
        </Button>
      </div>
    </div>
  );
}
