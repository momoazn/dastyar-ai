import { RotateCcw, Settings2 } from "lucide-react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { PromptInputBase } from "@/components/prompt-input-base";
import { TranscribeButton } from "@/components/transcribe-button";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { GenerationSettings } from "@/server/procedures/images";
import { AdvancedSettings } from "./advanced-settings";
import { SizeSelector } from "./size-selector";

type ImageGenerationInputProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  settings: GenerationSettings;
  onSettingsChange: (updates: Partial<GenerationSettings>) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  advancedSettingsOpen: boolean;
  onAdvancedSettingsToggle: () => void;
  samplers: string[];
  transcribeModel: string;
  onTranscribeModelChange: (model: string) => void;
  onTranscribeError: (error: string) => void;
  onTranscribed: (text: string) => void;
  onSizeChange: (value: string) => void;
  onResetSettings: () => void;
  getSizeValue: () => string;
  submitDisabled?: boolean;
  submitStatus?: "submitted" | undefined;
  submitVariant?: "default" | "destructive";
};

export function ImageGenerationInput({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
  settings,
  onSettingsChange,
  negativePrompt,
  onNegativePromptChange,
  advancedSettingsOpen,
  onAdvancedSettingsToggle,
  samplers,
  transcribeModel,
  onTranscribeModelChange,
  onTranscribeError,
  onTranscribed,
  onSizeChange,
  onResetSettings,
  getSizeValue,
  submitDisabled = false,
  submitStatus,
  submitVariant = "default",
}: ImageGenerationInputProps) {
  return (
    <PromptInputBase
      bottomContent={
        advancedSettingsOpen ? (
          <AdvancedSettings
            negativePrompt={negativePrompt}
            onNegativePromptChange={onNegativePromptChange}
            onSettingsChange={onSettingsChange}
            onTranscribed={onTranscribed}
            onTranscribeError={onTranscribeError}
            onTranscribeModelChange={onTranscribeModelChange}
            samplers={samplers}
            settings={settings}
            transcribeModel={transcribeModel}
          />
        ) : null
      }
      isGenerating={isGenerating}
      leftTools={
        <>
          <SizeSelector onValueChange={onSizeChange} value={getSizeValue()} />
          <PromptInputButton onClick={onResetSettings} variant="outline">
            <RotateCcw className="size-4" />
            {fa.imageGeneration.resetButton}
          </PromptInputButton>
        </>
      }
      onChange={onPromptChange}
      onSubmit={onSubmit}
      placeholder={fa.imageGeneration.promptPlaceholderAlt}
      rightTools={
        <>
          <PromptInputButton
            onClick={onAdvancedSettingsToggle}
            variant="outline"
          >
            <Settings2 className="size-4" />
            {fa.imageGeneration.advancedButton}
          </PromptInputButton>
          <TranscribeButton
            language={
              prompt && detectTextDirection(prompt) === "rtl" ? "fa" : "en"
            }
            model={transcribeModel}
            onError={onTranscribeError}
            onModelChange={onTranscribeModelChange}
            onTranscribed={(text) =>
              onPromptChange(prompt ? `${prompt} ${text}` : text)
            }
            size="icon"
            variant="outline"
          />
        </>
      }
      submitProps={{
        disabled: submitDisabled,
        status: submitStatus,
        variant: submitVariant,
      }}
      value={prompt}
    />
  );
}
