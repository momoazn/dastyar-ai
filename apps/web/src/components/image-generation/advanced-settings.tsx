import { TranscribeButton } from "@/components/transcribe-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from "@/components/ui";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { GenerationSettings } from "@/server/procedures/images";

type AdvancedSettingsProps = {
  settings: GenerationSettings;
  onSettingsChange: (updates: Partial<GenerationSettings>) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  samplers: string[];
  transcribeModel: string;
  onTranscribeModelChange: (model: string) => void;
  onTranscribeError: (error: string) => void;
  onTranscribed: (text: string) => void;
};

export function AdvancedSettings({
  settings,
  onSettingsChange,
  negativePrompt,
  onNegativePromptChange,
  samplers,
  transcribeModel,
  onTranscribeModelChange,
  onTranscribeError,
  onTranscribed,
}: AdvancedSettingsProps) {
  return (
    <div className="space-y-4 p-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            className="font-medium text-sm"
            htmlFor="negative-prompt-input"
          >
            {fa.imageGeneration.negativeLabel}
          </label>
          <TranscribeButton
            language="en"
            model={transcribeModel}
            onError={onTranscribeError}
            onModelChange={onTranscribeModelChange}
            onTranscribed={onTranscribed}
            size="icon"
            variant="ghost"
          />
        </div>
        <Textarea
          className="min-h-[70px] resize-none"
          dir={negativePrompt ? detectTextDirection(negativePrompt) : "rtl"}
          id="negative-prompt-input"
          onChange={(e) => onNegativePromptChange(e.target.value)}
          placeholder={fa.imageGeneration.negativePlaceholder}
          value={negativePrompt}
        />
      </div>
      <div>
        <label
          className="mb-2 block font-medium text-sm"
          htmlFor="sampler-select"
        >
          {fa.imageGeneration.samplerLabel}
        </label>
        <Select
          onValueChange={(value) => onSettingsChange({ sampler: value })}
          value={settings.sampler}
        >
          <SelectTrigger className="h-9 w-full cursor-pointer gap-2">
            <SelectValue placeholder={fa.imageGeneration.samplerPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {samplers.map((sampler: string) => (
              <SelectItem key={sampler} value={sampler}>
                {sampler}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-2 block font-medium text-sm"
            htmlFor="steps-slider"
          >
            {fa.imageGeneration.stepsLabelAlt.replace(
              "{steps}",
              settings.steps.toString()
            )}
          </label>
          <Slider
            className="w-full"
            id="steps-slider"
            max={150}
            min={1}
            onValueChange={([value]) => onSettingsChange({ steps: value })}
            step={1}
            value={[settings.steps]}
          />
        </div>
        <div>
          <label
            className="mb-2 block font-medium text-sm"
            htmlFor="cfg-slider"
          >
            CFG Scale: {settings.cfgScale}
          </label>
          <Slider
            className="w-full"
            id="cfg-slider"
            max={30}
            min={1}
            onValueChange={([value]) => onSettingsChange({ cfgScale: value })}
            step={0.5}
            value={[settings.cfgScale]}
          />
        </div>
      </div>
    </div>
  );
}
