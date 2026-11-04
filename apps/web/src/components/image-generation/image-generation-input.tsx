import { RotateCcw, Settings2 } from "lucide-react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { PromptInputBase } from "@/components/prompt-input-base";
import { TranscribeButton } from "@/components/transcribe-button";
import { fa } from "@/lib/texts";
import { detectTextDirection } from "@/lib/utils";
import type { GenerationSettings } from "@/server/procedures/images";
import { AdvancedSettings } from "./advanced-settings";
import { SizeSelector } from "./size-selector";

type ImageGenerationInputProps = {
  formProps: {
    prompt: string;
    setPrompt: (value: string) => void;
    negativePrompt: string;
    setNegativePrompt: (value: string) => void;
    advancedSettingsOpen: boolean;
    setAdvancedSettingsOpen: (value: boolean) => void;
    transcribeModel: string;
    setTranscribeModel: (model: string) => void;
    settings: GenerationSettings;
    handleSizeChange: (value: string) => void;
    getSizeValue: () => string;
    handleTranscribeError: (error: string) => void;
    handleTranscribed: (text: string) => void;
    onSettingsChange: (updates: Partial<GenerationSettings>) => void;
    samplers: string[];
  };
  onSubmit: () => void;
  onResetSettings: () => void;
  isGenerating: boolean;
  submitDisabled?: boolean;
  submitStatus?: "submitted" | undefined;
  submitVariant?: "default" | "destructive";
  disabled?: boolean;
};

export function ImageGenerationInput({
  formProps,
  onSubmit,
  onResetSettings,
  isGenerating,
  submitDisabled = false,
  submitStatus,
  submitVariant = "default",
  disabled = false,
}: ImageGenerationInputProps) {
  const {
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    advancedSettingsOpen,
    setAdvancedSettingsOpen,
    transcribeModel,
    setTranscribeModel,
    settings,
    handleSizeChange,
    getSizeValue,
    handleTranscribeError,
    handleTranscribed,
    onSettingsChange,
    samplers,
  } = formProps;
  return (
    <PromptInputBase
      bottomContent={
        advancedSettingsOpen ? (
          <AdvancedSettings
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            onSettingsChange={onSettingsChange}
            onTranscribed={handleTranscribed}
            onTranscribeError={handleTranscribeError}
            onTranscribeModelChange={setTranscribeModel}
            samplers={samplers}
            settings={settings}
            transcribeModel={transcribeModel}
          />
        ) : null
      }
      disabled={disabled}
      isGenerating={isGenerating}
      leftTools={
        <>
          <SizeSelector
            onValueChange={handleSizeChange}
            value={getSizeValue()}
          />
          <PromptInputButton
            aria-label={fa.imageGeneration.resetButton}
            onClick={onResetSettings}
            size="sm"
            title={fa.imageGeneration.resetButton}
            variant="outline"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">
              {fa.imageGeneration.resetButton}
            </span>
          </PromptInputButton>
        </>
      }
      onChange={setPrompt}
      onSubmit={onSubmit}
      placeholder={fa.imageGeneration.promptPlaceholderAlt}
      rightTools={
        <>
          <PromptInputButton
            aria-expanded={advancedSettingsOpen}
            aria-label={fa.imageGeneration.advancedButton}
            onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
            size="sm"
            title={fa.imageGeneration.advancedButton}
            variant="outline"
          >
            <Settings2 aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">
              {fa.imageGeneration.advancedButton}
            </span>
          </PromptInputButton>
          <TranscribeButton
            language={
              prompt && detectTextDirection(prompt) === "rtl" ? "fa" : "en"
            }
            model={transcribeModel}
            onError={handleTranscribeError}
            onModelChange={setTranscribeModel}
            onTranscribed={(text) =>
              setPrompt(prompt ? `${prompt} ${text}` : text)
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
