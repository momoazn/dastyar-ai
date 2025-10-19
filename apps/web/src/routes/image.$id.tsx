import { createFileRoute, useParams } from "@tanstack/react-router";
import { Download, ImagePlus, RotateCcw, Settings2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LS_TOKEN_KEY } from "@/atoms/auth";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Message as AIMsg,
  MessageContent as AIMsgContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { ConversationScaffold } from "@/components/scaffold/conversation-scaffold";
import { TranscribeButton } from "@/components/transcribe-button";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useImageGeneration } from "@/hooks/use-image-generation";
import { useImageThreads } from "@/hooks/use-image-threads";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { GenerationSettings } from "@/server/procedures/images";

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, distorted, deformed, extra limbs, bad anatomy, text, watermark, logo, grainy, out of frame, ugly, poorly drawn, unnatural lighting";

const DEFAULT_SETTINGS: GenerationSettings = {
  steps: 20,
  cfgScale: 7.5,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  sampler: "Euler a",
  width: 512,
  height: 512,
};

const IMAGE_SIZES = [
  { label: "512x512", value: 512 },
  { label: "768x768", value: 768 },
  { label: "1024x1024", value: 1024 },
  { label: "512x768", value: "512x768" },
  { label: "768x512", value: "768x512" },
] as const;

export const Route = createFileRoute("/image/$id")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function ImageBadges({ settings }: { settings: GenerationSettings }) {
  return (
    <div className="pointer-events-none absolute right-2 bottom-2 flex flex-wrap gap-2">
      <Badge variant="secondary">
        {settings.width}×{settings.height}
      </Badge>
      <Badge variant="secondary">{String(settings.sampler)}</Badge>
      <Badge variant="secondary">steps: {Number(settings.steps)}</Badge>
      <Badge variant="secondary">cfg: {Number(settings.cfgScale)}</Badge>
    </div>
  );
}

function getMergedSettings(
  raw: Partial<GenerationSettings>,
  defaults: GenerationSettings
) {
  return {
    width: typeof raw.width === "number" ? raw.width : defaults.width,
    height: typeof raw.height === "number" ? raw.height : defaults.height,
    sampler: typeof raw.sampler === "string" ? raw.sampler : defaults.sampler,
    steps: typeof raw.steps === "number" ? raw.steps : defaults.steps,
    cfgScale:
      typeof raw.cfgScale === "number" ? raw.cfgScale : defaults.cfgScale,
  };
}

const TRAILING_SLASH_RE = /\/$/;

function buildSrc(url: string, token: string | null) {
  const server = (import.meta.env.VITE_SERVER_URL || "").replace(
    TRAILING_SLASH_RE,
    ""
  );
  const absolute = url.startsWith("http") ? url : `${server}${url}`;
  return token ? `${absolute}?token=${encodeURIComponent(token)}` : absolute;
}

function RouteComponent() {
  const { id: threadId } = useParams({ from: "/image/$id" });
  const numericThreadId = Number(threadId);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [settings, setSettings] =
    useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [transcribeModel, setTranscribeModel] = useState("");
  const token = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_TOKEN_KEY) || "null");
    } catch {
      return null;
    }
  }, []);

  const { rename } = useImageThreads();

  const {
    images = [],
    refetchImages,
    samplers,
    isServiceAvailable,
    generate,
    isGenerating,
    downloadImage,
  } = useImageGeneration(numericThreadId);

  const handleSubmit = useCallback(
    async (promptText: string, generationSettings: GenerationSettings) => {
      if (!promptText.trim()) {
        toast.error(fa.imageGeneration.promptRequired);
        return;
      }

      if (!isServiceAvailable) {
        toast.error(fa.imageGeneration.serviceUnavailableError);
        return;
      }

      const result = await generate({
        ...generationSettings,
        prompt: promptText.trim(),
        threadId: numericThreadId,
      });

      if (result) {
        refetchImages();

        // Rename thread on first image generation
        if (images.length === 0) {
          const title = promptText.trim().slice(0, 50);
          await rename.mutateAsync({ id: numericThreadId, title });
        }
      }
    },
    [
      generate,
      isServiceAvailable,
      numericThreadId,
      refetchImages,
      images.length,
      rename,
    ]
  );

  const handleSizeChange = (value: string) => {
    if (value.includes("x")) {
      const [width, height] = value.split("x").map(Number);
      setSettings((prev) => ({ ...prev, width, height }));
    } else {
      const size = Number(value);
      setSettings((prev) => ({ ...prev, width: size, height: size }));
    }
  };

  const getSizeValue = () => {
    if (settings.width === settings.height) {
      return settings.width.toString();
    }
    return `${settings.width}x${settings.height}`;
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const orderedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
      }),
    [images]
  );

  if (Number.isNaN(numericThreadId) || numericThreadId <= 0) {
    return (
      <div className="flex h-full items-center justify-center" dir="rtl">
        <Alert>
          <AlertDescription>{fa.invalidThreadId}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ConversationScaffold
      banner={
        isServiceAvailable ? null : (
          <Alert>
            <AlertDescription>
              {fa.imageGeneration.serviceUnavailableAlert}
            </AlertDescription>
          </Alert>
        )
      }
      conversation={
        <Conversation className="h-full">
          <ConversationContent>
            {orderedImages.map((img) => {
              const raw = img.settings || {};
              const s = getMergedSettings(raw, settings);
              const src = buildSrc(img.url, token);
              const aspect = `${Math.max(1, s.width)} / ${Math.max(
                1,
                s.height
              )}`;
              return (
                <div className="space-y-1" key={img.id}>
                  <AIMsg from="user">
                    <AIMsgContent>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {img.prompt}
                      </div>
                      {img.negativePrompt ? (
                        <div className="text-[12px] text-muted-foreground">
                          {fa.imageGeneration.negativePrefix}{" "}
                          {img.negativePrompt}
                        </div>
                      ) : null}
                    </AIMsgContent>
                  </AIMsg>
                  <AIMsg from="assistant">
                    <AIMsgContent>
                      <div className="relative inline-block overflow-hidden rounded-md border">
                        <img
                          alt={img.prompt}
                          className="h-auto max-w-full bg-muted object-contain"
                          height={s.height}
                          src={src}
                          style={{ aspectRatio: aspect }}
                          width={s.width}
                        />
                        <ImageBadges settings={s} />
                        <div className="absolute top-2 left-2 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                aria-label={fa.imageGeneration.downloadImage}
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  downloadImage({ id: img.id, url: src });
                                }}
                                size="icon"
                                variant="secondary"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {fa.imageGeneration.downloadImage}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </AIMsgContent>
                  </AIMsg>
                </div>
              );
            })}
            {isGenerating && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      }
      empty={
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <ImagePlus className="size-10" />
          <div className="space-y-1">
            <div className="font-medium">{fa.imageGeneration.newChatTitle}</div>
            <div className="text-xs">
              {fa.imageGeneration.newChatDescription}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="mx-auto max-w-4xl px-6 py-4">
          <PromptInput
            onSubmit={(e) => {
              e.preventDefault();
              if (isGenerating || !prompt.trim() || !isServiceAvailable) {
                return;
              }
              handleSubmit(prompt, {
                steps: settings.steps,
                cfgScale: settings.cfgScale,
                negativePrompt,
                sampler: settings.sampler,
                width: settings.width,
                height: settings.height,
              });
            }}
          >
            <PromptInputTextarea
              dir={prompt ? detectTextDirection(prompt) : "rtl"}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={fa.imageGeneration.promptPlaceholderAlt}
              value={prompt}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <Select onValueChange={handleSizeChange} value={getSizeValue()}>
                  <SelectTrigger className="h-9 w-36 cursor-pointer gap-2">
                    <SelectValue
                      placeholder={fa.imageGeneration.sizePlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZES.map((size) => (
                      <SelectItem
                        key={size.label}
                        value={size.value.toString()}
                      >
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PromptInputButton onClick={resetSettings} variant="outline">
                  <RotateCcw className="size-4" />
                  {fa.imageGeneration.resetButton}
                </PromptInputButton>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                <PromptInputButton
                  onClick={() => setAdvancedSettingsOpen((v) => !v)}
                  variant="outline"
                >
                  <Settings2 className="size-4" />
                  {fa.imageGeneration.advancedButton}
                </PromptInputButton>
                <TranscribeButton
                  language="en"
                  model={transcribeModel}
                  onError={(error) => {
                    toast.error(
                      `${fa.imageGeneration.voiceTranscriptionError} ${error}`
                    );
                  }}
                  onModelChange={setTranscribeModel}
                  onTranscribed={(text) =>
                    setPrompt((prev) => (prev ? `${prev} ${text}` : text))
                  }
                  size="icon"
                  variant="outline"
                />
                <PromptInputSubmit
                  disabled={
                    isGenerating || !prompt.trim() || !isServiceAvailable
                  }
                  status={isGenerating ? "submitted" : undefined}
                  variant={isGenerating ? "destructive" : "default"}
                />
              </div>
            </PromptInputToolbar>
            {advancedSettingsOpen && (
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
                      onError={(error) => {
                        toast.error(
                          `${fa.imageGeneration.voiceTranscriptionError} ${error}`
                        );
                      }}
                      onModelChange={setTranscribeModel}
                      onTranscribed={(text) => setNegativePrompt(text)}
                      size="icon"
                      variant="ghost"
                    />
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
            )}
          </PromptInput>
        </div>
      }
      isEmpty={orderedImages.length === 0 && !isGenerating}
    />
  );
}
