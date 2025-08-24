import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { ChevronRight, ImagePlus, Send, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from '@/components/ui';
import type {
  GeneratedImage,
  ImageGenerationParams,
} from '@/hooks/use-image-generation';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { fa } from '@/lib/persian-texts';

const DEFAULT_SETTINGS: Omit<ImageGenerationParams, 'prompt'> = {
  steps: 5,
  cfg_scale: 7.5,
  negative_prompt: '',
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

export const Route = createFileRoute('/image')({
  component: ImageRouteComponent,
});

function ImageRouteComponent() {
  const location = useLocation();
  const isDetailView =
    location.pathname.startsWith('/image/') && location.pathname !== '/image';
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [lastGeneratedImage, setLastGeneratedImage] =
    useState<GeneratedImage | null>(null);

  const {
    images,
    samplers,
    isServiceAvailable,
    clearHistory,
    // generateImage,
    generateImageAsync,
    isGenerating,
  } = useImageGeneration();

  const handleGenerate = async () => {
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
    const created = await generateImageAsync(params);
    if (created) {
      setLastGeneratedImage(created as unknown as GeneratedImage);
    }
  };

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

  if (isDetailView) {
    return <Outlet />;
  }

  return (
    <main className="container mx-auto h-full max-w-6xl p-4">
      <div className="flex h-full flex-col gap-4">
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-[320px] p-6">
              <div className="space-y-4 text-center">
                <ImagePlus className="mx-auto h-12 w-12 animate-pulse text-primary" />
                <div>
                  <h3 className="font-semibold">
                    {fa.imageGeneration.generatingAlt}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {fa.imageGeneration.generatingDescription}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!isServiceAvailable && (
          <Alert>
            <AlertDescription>
              {fa.imageGeneration.serviceUnavailableAlert}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{fa.imageGeneration.title}</h2>
          {Array.isArray(images) && images.length > 0 && (
            <Button
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={clearHistory}
              size="sm"
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {fa.imageGeneration.clearAll}
            </Button>
          )}
        </div>

        {/* Session Preview (only after a generation in this session) */}
        <Card className="p-4">
          <h3 className="mb-3 font-medium text-sm">پیش‌نمایش تصویر</h3>
          <div className="mx-auto flex size-52 items-center justify-center overflow-hidden rounded-md bg-muted sm:h-56 sm:w-56 md:h-64 md:w-64">
            {lastGeneratedImage ? (
              <img
                alt={lastGeneratedImage.prompt}
                className="h-full w-full object-contain"
                src={lastGeneratedImage.imageUrl}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <ImagePlus className="mb-2 size-14" />
                <span className="text-sm">هنوز تصویری تولید نشده است</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-4">
            {/* Quick Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="size-select"
                >
                  {fa.imageGeneration.size}
                </label>
                <Select onValueChange={handleSizeChange} value={getSizeValue()}>
                  <SelectTrigger id="size-select">
                    <SelectValue />
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
                  <SelectTrigger id="sampler-select">
                    <SelectValue />
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
            </div>

            {/* Advanced Settings */}
            <Collapsible
              onOpenChange={setAdvancedSettingsOpen}
              open={advancedSettingsOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  className="w-full justify-between"
                  size="sm"
                  variant="outline"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    تنظیمات پیشرفته
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${advancedSettingsOpen ? 'rotate-90' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 grid grid-cols-2 gap-4">
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
                      <span>کم‌تر (سریع‌تر)</span>
                      <span>بیش‌تر (باکیفیت‌تر)</span>
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
                      <span>آزاد</span>
                      <span>دقیق</span>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Prompt Section */}
            <div className="space-y-3">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="prompt-input"
                >
                  {fa.imageGeneration.promptLabel}
                </label>
                <Textarea
                  className="min-h-[90px] resize-none"
                  dir="auto"
                  id="prompt-input"
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={fa.imageGeneration.promptPlaceholder}
                  value={prompt}
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  نکات: از کلمات کلیدی واضح استفاده کنید، سبک‌ها و جزئیات را مشخص
                  کنید
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="negative-prompt-input"
                >
                  {fa.imageGeneration.negativePromptLabel}
                </label>
                <Textarea
                  className="min-h-[70px] resize-none"
                  dir="auto"
                  id="negative-prompt-input"
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder={fa.imageGeneration.negativePromptPlaceholder}
                  value={negativePrompt}
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  عناصری که نمی‌خواهید در تصویر باشند (اختیاری)
                </p>
              </div>

              <Button
                className="w-full"
                disabled={isGenerating || !prompt.trim() || !isServiceAvailable}
                onClick={handleGenerate}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <ImagePlus className="mr-2 h-4 w-4 animate-pulse" />
                    {fa.imageGeneration.generatingButton}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {fa.imageGeneration.generateButton}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
