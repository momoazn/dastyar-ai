import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { Download, ImagePlus, RotateCcw, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Image as AIImage } from '@/components/ai-elements/image';
import { Loader } from '@/components/ai-elements/loader';
import {
  Message as AIMsg,
  MessageContent as AIMsgContent,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { TranscribeButton } from '@/components/transcribe-button';
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
} from '@/components/ui';
import type {
  GeneratedImage,
  ImageGenerationParams,
} from '@/hooks/use-image-generation';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { fa } from '@/lib/persian-texts';
import { detectTextDirection } from '@/lib/utils';

const DEFAULT_NEGATIVE_PROMPT =
  'blurry, low quality, distorted, deformed, extra limbs, bad anatomy, text, watermark, logo, grainy, out of frame, ugly, poorly drawn, unnatural lighting';

const DEFAULT_SETTINGS: Omit<ImageGenerationParams, 'prompt'> = {
  steps: 20,
  cfg_scale: 7.5,
  negative_prompt: DEFAULT_NEGATIVE_PROMPT,
  sampler_name: 'Euler a',
  width: 512,
  height: 512,
};

const IMAGE_SIZES = [
  { label: '512x512', value: 512 },
  { label: '768x768', value: 768 },
  { label: '1024x1024', value: 1024 },
  { label: '512x768', value: '512x768' },
  { label: '768x512', value: '768x512' },
] as const;

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const Route = createFileRoute('/image')({
  component: ImageRouteComponent,
});

function ImageRouteComponent() {
  const location = useLocation();
  const isDetailView =
    location.pathname.startsWith('/image/') && location.pathname !== '/image';
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [transcribeModel, setTranscribeModel] = useState('');
  const [imageDataById, setImageDataById] = useState<
    Record<
      string,
      {
        base64: string;
        uint8Array: Uint8Array;
        mediaType: string;
      }
    >
  >({});

  const {
    images,
    samplers,
    isServiceAvailable,
    generateImageAsync,
    isGenerating,
    downloadImage,
  } = useImageGeneration();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error(fa.imageGeneration.promptRequired);
      return;
    }

    if (!isServiceAvailable) {
      toast.error(fa.imageGeneration.serviceUnavailableError);
      return;
    }

    const params: ImageGenerationParams = {
      ...settings,
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
    };
    await generateImageAsync(params);
  }, [
    prompt,
    negativePrompt,
    settings,
    isServiceAvailable,
    generateImageAsync,
  ]);

  const handleSizeChange = (value: string) => {
    if (value.includes('x')) {
      const [width, height] = value.split('x').map(Number);
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

  // Chat layout does not need keydown handler or static preview aspect

  const orderedImages = useMemo(() => {
    const list = Array.isArray(images)
      ? ([...images] as unknown as GeneratedImage[])
      : ([] as GeneratedImage[]);
    return list.sort((a, b) => {
      const aTime = toDate(a.createdAt)?.getTime() ?? 0;
      const bTime = toDate(b.createdAt)?.getTime() ?? 0;
      return aTime - bTime;
    });
  }, [images]);

  useEffect(() => {
    const list = Array.isArray(orderedImages) ? orderedImages : [];
    const missing = list.filter((img) => !imageDataById[img.id]);
    if (missing.length === 0) {
      return;
    }
    let cancelled = false;
    Promise.all(
      missing.map(async (img) => {
        try {
          const res = await fetch(img.imageUrl);
          if (!res.ok) {
            return null;
          }
          const blob = await res.blob();
          const mediaType = blob.type || 'image/png';
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = (reader.result as string) || '';
              const commaIndex = result.indexOf(',');
              resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
          return { id: img.id, mediaType, uint8Array, base64 };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) {
        return;
      }
      const additions = results.filter(Boolean) as Array<{
        id: string;
        base64: string;
        uint8Array: Uint8Array;
        mediaType: string;
      }>;
      if (additions.length === 0) {
        return;
      }
      setImageDataById((prev) => {
        const next = { ...prev } as typeof prev;
        for (const it of additions) {
          next[it.id] = {
            base64: it.base64,
            uint8Array: it.uint8Array,
            mediaType: it.mediaType,
          };
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [orderedImages, imageDataById]);

  if (isDetailView) {
    return <Outlet />;
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {!isServiceAvailable && (
        <div className="p-3">
          <Alert>
            <AlertDescription>
              {fa.imageGeneration.serviceUnavailableAlert}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {(!Array.isArray(orderedImages) || orderedImages.length === 0) &&
        !isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ImagePlus className="size-10" />
            <div className="space-y-1">
              <div className="font-medium">{fa.imageGeneration.title}</div>
              <div className="text-xs">{fa.imageGeneration.shortcutHint}</div>
            </div>
          </div>
        ) : (
          <Conversation className="h-full">
            <ConversationContent>
              {orderedImages.map((img) => {
                const s = img.settings ?? {
                  steps: settings.steps,
                  cfg_scale: settings.cfg_scale,
                  sampler_name: settings.sampler_name,
                  width: settings.width,
                  height: settings.height,
                };
                const aspect = `${Math.max(1, s.width)} / ${Math.max(1, s.height)}`;
                return (
                  <div className="space-y-1" key={img.id}>
                    <AIMsg from="user">
                      <AIMsgContent>
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {img.prompt}
                        </div>
                        {img.negativePrompt ? (
                          <div className="text-[12px] text-muted-foreground">
                            {fa.imageGeneration.negativePromptLabel}:{' '}
                            {img.negativePrompt}
                          </div>
                        ) : null}
                      </AIMsgContent>
                    </AIMsg>
                    <AIMsg from="assistant">
                      <AIMsgContent>
                        <div className="relative inline-block overflow-hidden rounded-md border">
                          {imageDataById[img.id] ? (
                            <AIImage
                              {...imageDataById[img.id]}
                              alt={img.prompt}
                              className="h-auto max-w-full bg-muted object-contain"
                              style={{ aspectRatio: aspect }}
                            />
                          ) : (
                            <img
                              alt={img.prompt}
                              className="h-auto max-w-full bg-muted object-contain"
                              src={img.imageUrl}
                              style={{ aspectRatio: aspect }}
                            />
                          )}
                          <div className="pointer-events-none absolute right-2 bottom-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              {s.width}×{s.height}
                            </Badge>
                            <Badge variant="secondary">{s.sampler_name}</Badge>
                            <Badge variant="secondary">steps: {s.steps}</Badge>
                            <Badge variant="secondary">
                              cfg: {s.cfg_scale}
                            </Badge>
                          </div>
                          <div className="absolute top-2 left-2 flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  aria-label={fa.imageGeneration.downloadImage}
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    downloadImage(img);
                                  }}
                                  size="icon"
                                  variant="secondary"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {fa.imageGeneration.downloadImageTooltip}
                              </TooltipContent>
                            </Tooltip>
                            <Button asChild size="sm" variant="secondary">
                              <Link params={{ id: img.id }} to="/image/$id">
                                {fa.imageGeneration.viewDetailsTooltip}
                              </Link>
                            </Button>
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
        )}
      </div>

      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <PromptInput
            onSubmit={(e) => {
              e.preventDefault();
              if (isGenerating || !prompt.trim() || !isServiceAvailable) {
                return;
              }
              handleGenerate();
            }}
          >
            <PromptInputTextarea
              dir={prompt ? detectTextDirection(prompt) : 'rtl'}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={fa.imageGeneration.promptPlaceholder}
              value={prompt}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <Select onValueChange={handleSizeChange} value={getSizeValue()}>
                  <SelectTrigger className="h-9 w-36 cursor-pointer gap-2">
                    <SelectValue placeholder={fa.imageGeneration.size} />
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
                {null}
                <PromptInputButton onClick={resetSettings} variant="outline">
                  <RotateCcw className="size-4" />
                  {fa.imageGeneration.resetToDefault}
                </PromptInputButton>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                <PromptInputButton
                  onClick={() => setAdvancedSettingsOpen((v) => !v)}
                  variant="outline"
                >
                  <Settings2 className="size-4" />
                  {fa.imageGeneration.advancedSettings}
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
                  status={isGenerating ? 'submitted' : undefined}
                  variant={isGenerating ? 'destructive' : 'default'}
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
                      {fa.imageGeneration.negativePromptLabel}
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
                        : 'rtl'
                    }
                    id="negative-prompt-input"
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder={fa.imageGeneration.negativePromptPlaceholder}
                    value={negativePrompt}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    {fa.imageGeneration.negativePromptHint}
                  </p>
                </div>
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="sampler-select"
                  >
                    {fa.imageGeneration.sampler}
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, sampler_name: value }))
                    }
                    value={settings.sampler_name}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer gap-2">
                      <SelectValue placeholder={fa.imageGeneration.sampler} />
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
                      {fa.imageGeneration.steps.replace(
                        '{steps}',
                        String(settings.steps)
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
                    <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                      <span>{fa.imageGeneration.stepsHintLess}</span>
                      <span>{fa.imageGeneration.stepsHintMore}</span>
                    </div>
                  </div>
                  <div>
                    <label
                      className="mb-2 block font-medium text-sm"
                      htmlFor="cfg-slider"
                    >
                      {fa.imageGeneration.cfgScale}: {settings.cfg_scale}
                    </label>
                    <Slider
                      className="w-full"
                      id="cfg-slider"
                      max={30}
                      min={1}
                      onValueChange={([value]) =>
                        setSettings((prev) => ({ ...prev, cfg_scale: value }))
                      }
                      step={0.5}
                      value={[settings.cfg_scale]}
                    />
                    <div className="mt-1 flex justify-between text-muted-foreground text-xs">
                      <span>{fa.imageGeneration.cfgHintFree}</span>
                      <span>{fa.imageGeneration.cfgHintPrecise}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
