import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, RotateCcw, Settings2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { PromptInputBase } from "@/components/prompt-input-base";
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
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { GenerationSettings } from "@/server/procedures/images";

export const Route = createFileRoute("/image/")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { create } = useImageThreads();
  const { samplers, isServiceAvailable } = useImageGeneration();

  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, low quality, distorted, deformed, extra limbs, bad anatomy, text, watermark, logo, grainy, out of frame, ugly, poorly drawn, unnatural lighting"
  );
  const [transcribeModel, setTranscribeModel] = useState("");
  const [settings, setSettings] = useState<GenerationSettings>({
    steps: 20,
    cfgScale: 7.5,
    negativePrompt,
    sampler: "Euler a",
    width: 512,
    height: 512,
  });

  // Keep settings.negativePrompt in sync with the dedicated state
  useEffect(() => {
    setSettings((prev) => ({ ...prev, negativePrompt }));
  }, [negativePrompt]);

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || creating) {
      return;
    }
    if (!isServiceAvailable) {
      return;
    }
    try {
      setCreating(true);
      const created = await create.mutateAsync({
        title: fa.imageChat.newChatDefaultTitle,
      });
      navigate({
        to: "/image/$id",
        params: { id: created.id.toString() },
        search: {
          initialPrompt: trimmed,
          width: settings.width,
          height: settings.height,
          steps: settings.steps,
          cfgScale: settings.cfgScale,
          sampler: settings.sampler,
          negativePrompt,
        },
      });
    } finally {
      setCreating(false);
    }
  }, [
    prompt,
    creating,
    isServiceAvailable,
    create,
    navigate,
    settings,
    negativePrompt,
  ]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="mx-auto w-full max-w-3xl" dir="rtl">
        <div className="mb-6 text-center">
          <ImagePlus className="mx-auto mb-2 size-12 text-muted-foreground" />
          <h1 className="font-semibold text-2xl">
            {fa.imageChat.newChatTitle}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fa.imageChat.newChatDescription}
          </p>
        </div>
        <PromptInputBase
          bottomContent={
            advancedSettingsOpen ? (
              <div className="space-y-4 p-3">
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="sampler-select"
                  >
                    {fa.imageGeneration.samplerLabel}
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, sampler: value }))
                    }
                    value={settings.sampler}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer gap-2">
                      <SelectValue
                        placeholder={fa.imageGeneration.samplerPlaceholder}
                      />
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
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      className="font-medium text-sm"
                      htmlFor="negative-prompt-input"
                    >
                      {fa.imageGeneration.negativeLabel}
                    </label>
                  </div>
                  <Textarea
                    className="min-h-[70px] resize-none"
                    dir={
                      negativePrompt
                        ? detectTextDirection(negativePrompt)
                        : "rtl"
                    }
                    id="negative-prompt-input"
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder={fa.imageGeneration.negativePlaceholder}
                    value={negativePrompt}
                  />
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
                      onValueChange={([value]) =>
                        setSettings((prev) => ({ ...prev, steps: value }))
                      }
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
                      onValueChange={([value]) =>
                        setSettings((prev) => ({ ...prev, cfgScale: value }))
                      }
                      step={0.5}
                      value={[settings.cfgScale]}
                    />
                  </div>
                </div>
              </div>
            ) : null
          }
          isGenerating={creating}
          leftTools={
            <>
              <Select
                onValueChange={(value) => {
                  if (value.includes("x")) {
                    const [w, h] = value.split("x").map(Number);
                    setSettings((prev) => ({ ...prev, width: w, height: h }));
                  } else {
                    const size = Number(value);
                    setSettings((prev) => ({
                      ...prev,
                      width: size,
                      height: size,
                    }));
                  }
                }}
                value={
                  settings.width === settings.height
                    ? String(settings.width)
                    : `${settings.width}x${settings.height}`
                }
              >
                <SelectTrigger className="h-9 w-36 cursor-pointer gap-2">
                  <SelectValue
                    placeholder={fa.imageGeneration.sizePlaceholder}
                  />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { label: "512x512", value: 512 },
                    { label: "768x768", value: 768 },
                    { label: "1024x1024", value: 1024 },
                    { label: "512x768", value: "512x768" },
                    { label: "768x512", value: "768x512" },
                  ].map((size) => (
                    <SelectItem
                      key={String(size.label)}
                      value={String(size.value)}
                    >
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <PromptInputButton
                onClick={() =>
                  setSettings((prev) => ({ ...prev, steps: 20, cfgScale: 7.5 }))
                }
                variant="outline"
              >
                <RotateCcw className="size-4" />
                {fa.imageGeneration.resetButton}
              </PromptInputButton>
            </>
          }
          onChange={setPrompt}
          onSubmit={() => {
            if (!creating) handleSubmit().catch(() => {});
          }}
          placeholder={fa.imageGeneration.promptPlaceholderAlt}
          rightTools={
            <>
              <PromptInputButton
                onClick={() => setAdvancedSettingsOpen((v) => !v)}
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
                onError={() => {}}
                onModelChange={setTranscribeModel}
                onTranscribed={(text) =>
                  setPrompt((prev) => (prev ? `${prev} ${text}` : text))
                }
                size="icon"
                variant="outline"
              />
            </>
          }
          submitProps={{ disabled: creating || !prompt.trim() }}
          value={prompt}
        />
      </div>
    </div>
  );
}
