import { ArrowLeftRightIcon } from "lucide-react";
import {
  ModelSelect,
  SettingField,
  ToolSettings,
} from "@/components/tool-page/tool-page";
import { Button } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLanguageOptions, createToneOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/texts";
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

type LanguageSelectProps = {
  label: string;
  value: LanguageCode;
  disabled: boolean;
  onChange: (lang: LanguageCode) => void;
};

function LanguageSelect({
  label,
  value,
  disabled,
  onChange,
}: LanguageSelectProps) {
  return (
    <SettingField label={label}>
      <Select
        disabled={disabled}
        onValueChange={(v) => onChange(v as LanguageCode)}
        value={value}
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
    </SettingField>
  );
}

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
    <ToolSettings
      className="sm:grid-cols-1 lg:grid-cols-1"
      title={fa.translation.settingsTitle}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3">
        <LanguageSelect
          disabled={isTranslating}
          label={fa.translation.sourceLanguage}
          onChange={onSourceLanguageChange}
          value={sourceLanguage}
        />
        <div className="flex items-end">
          <Button
            aria-label={fa.translation.swapLanguages}
            disabled={isTranslating}
            onClick={onSwapLanguages}
            size="icon"
            title={fa.translation.swapLanguages}
            type="button"
            variant="outline"
          >
            <ArrowLeftRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <LanguageSelect
          disabled={isTranslating}
          label={fa.translation.targetLanguage}
          onChange={onTargetLanguageChange}
          value={targetLanguage}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SettingField label={fa.translation.translationTone}>
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
                <SelectItem
                  className="text-right"
                  key={t.value}
                  value={t.value}
                >
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingField>
        <ModelSelect
          disabled={isTranslating}
          isLoading={isModelsLoading}
          label={fa.translation.model}
          modelId={modelId}
          models={models}
          onChange={onModelChange}
        />
      </div>
    </ToolSettings>
  );
}
