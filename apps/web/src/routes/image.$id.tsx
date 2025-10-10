import { createFileRoute, useParams } from '@tanstack/react-router';
import { Download, ImagePlus, RotateCcw, Settings2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
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
import type { ImageGenerationParams } from '@/hooks/use-image-generation';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { useImageThreads } from '@/hooks/use-image-threads';
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

export const Route = createFileRoute('/image/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: threadId } = useParams({ from: '/image/$id' });
  const numericThreadId = Number(threadId);

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE_PROMPT);
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [transcribeModel, setTranscribeModel] = useState('');

  const { rename } = useImageThreads();

  const {
    images = [],
    refetchImages,
    samplers,
    isServiceAvailable,
    generateImageAsync,
    isGenerating,
    downloadImage,
  } = useImageGeneration(numericThreadId);

  const handleSubmit = useCallback(
    async (promptText: string, generationSettings: ImageGenerationParams) => {
      if (!promptText.trim()) {
        toast.error('لطفاً توضیحات تصویر را وارد کنید');
        return;
      }

      if (!isServiceAvailable) {
        toast.error('سرویس Stable Diffusion در دسترس نیست');
        return;
      }

      const result = await generateImageAsync({
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
      generateImageAsync,
      isServiceAvailable,
      numericThreadId,
      refetchImages,
      images.length,
      rename,
    ]
  );

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

  const orderedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    });
  }, [images]);

  if (Number.isNaN(numericThreadId) || numericThreadId <= 0) {
    return (
      <div className="flex h-full items-center justify-center" dir="rtl">
        <Alert>
          <AlertDescription>شناسه گفتگوی نامعتبر</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {!isServiceAvailable && (
        <div className="p-3">
          <Alert>
            <AlertDescription>
              سرویس Stable Diffusion در دسترس نیست
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {orderedImages.length === 0 && !isGenerating ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ImagePlus className="size-10" />
            <div className="space-y-1">
              <div className="font-medium">گفتگوی تصویری جدید</div>
              <div className="text-xs">اولین تصویر خود را تولید کنید</div>
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
                            منفی: {img.negativePrompt}
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
                            src={img.imageUrl}
                            style={{ aspectRatio: aspect }}
                          />
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
                                  aria-label="دانلود تصویر"
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
                              <TooltipContent>دانلود تصویر</TooltipContent>
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
              handleSubmit(prompt, {
                prompt,
                steps: settings.steps,
                cfg_scale: settings.cfg_scale,
                negative_prompt: negativePrompt,
                sampler_name: settings.sampler_name,
                width: settings.width,
                height: settings.height,
              });
            }}
          >
            <PromptInputTextarea
              dir={prompt ? detectTextDirection(prompt) : 'rtl'}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="توضیحات تصویر خود را وارد کنید..."
              value={prompt}
            />
            <PromptInputToolbar>
              <PromptInputTools>
                <Select onValueChange={handleSizeChange} value={getSizeValue()}>
                  <SelectTrigger className="h-9 w-36 cursor-pointer gap-2">
                    <SelectValue placeholder="اندازه" />
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
                  بازنشانی
                </PromptInputButton>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                <PromptInputButton
                  onClick={() => setAdvancedSettingsOpen((v) => !v)}
                  variant="outline"
                >
                  <Settings2 className="size-4" />
                  پیشرفته
                </PromptInputButton>
                <TranscribeButton
                  language="en"
                  model={transcribeModel}
                  onError={(error) => {
                    toast.error(`خطا در تبدیل صدا: ${error}`);
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
                      منفی
                    </label>
                    <TranscribeButton
                      language="en"
                      model={transcribeModel}
                      onError={(error) => {
                        toast.error(`خطا در تبدیل صدا: ${error}`);
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
                    placeholder="توضیحات منفی..."
                    value={negativePrompt}
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="sampler-select"
                  >
                    نمونه‌بردار
                  </label>
                  <Select
                    onValueChange={(value) =>
                      setSettings((prev) => ({ ...prev, sampler_name: value }))
                    }
                    value={settings.sampler_name}
                  >
                    <SelectTrigger className="h-9 w-full cursor-pointer gap-2">
                      <SelectValue placeholder="نمونه‌بردار" />
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
                      مراحل: {settings.steps}
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
                      CFG Scale: {settings.cfg_scale}
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
