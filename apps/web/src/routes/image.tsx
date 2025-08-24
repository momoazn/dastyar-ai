import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import {
  ArrowUpDown,
  ChevronRight,
  Download,
  ImagePlus,
  RotateCcw,
  Send,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Badge,
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
  Skeleton,
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
    generateImageAsync,
    isGenerating,
    isLoadingImages,
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
    const created = await generateImageAsync(params);
    if (created) {
      setLastGeneratedImage(created as unknown as GeneratedImage);
    }
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

  const swapDimensions = () => {
    setSettings((prev) => ({
      ...prev,
      width: prev.height,
      height: prev.width,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const onPromptKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const previewAspect = useMemo(
    () => `${Math.max(1, settings.width)} / ${Math.max(1, settings.height)}`,
    [settings.width, settings.height]
  );

  if (isDetailView) {
    return <Outlet />;
  }

  return (
    <main className="container mx-auto max-w-7xl p-4" dir="rtl">
      <div className="flex flex-col gap-4">
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

        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">
              {fa.imageGeneration.title}
            </h2>
            <p className="mt-1 text-muted-foreground text-xs">
              {fa.imageGeneration.shortcutHint}
            </p>
          </div>
          {Array.isArray(images) && images.length > 0 && (
            <Button
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={clearHistory}
              size="sm"
              variant="outline"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              {fa.imageGeneration.clearAll}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left: Preview + Gallery */}
          <section className="space-y-6 md:col-span-7">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">پیش‌نمایش تصویر</h3>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="جابجایی ابعاد"
                        className="h-8 w-8"
                        onClick={swapDimensions}
                        size="icon"
                        variant="ghost"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>جابجایی عرض و ارتفاع</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        aria-label="بازنشانی تنظیمات"
                        className="h-8 w-8"
                        onClick={resetSettings}
                        size="icon"
                        variant="ghost"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>بازنشانی به پیش‌فرض</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div
                className="relative mt-3 w-full overflow-hidden rounded-md bg-muted"
                style={{ aspectRatio: previewAspect }}
              >
                {lastGeneratedImage ? (
                  <img
                    alt={lastGeneratedImage.prompt}
                    className="h-full w-full object-contain"
                    src={lastGeneratedImage.imageUrl}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <ImagePlus className="mb-2 h-10 w-10" />
                      <span className="text-sm">
                        {fa.imageGeneration.noImagesYet}
                      </span>
                    </div>
                  </div>
                )}

                {/* Badges overlay */}
                <div className="pointer-events-none absolute right-2 bottom-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {settings.width}×{settings.height}
                  </Badge>
                  <Badge variant="secondary">{settings.sampler_name}</Badge>
                  <Badge variant="secondary">steps: {settings.steps}</Badge>
                  <Badge variant="secondary">cfg: {settings.cfg_scale}</Badge>
                </div>

                {/* Actions overlay */}
                {lastGeneratedImage && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <Button
                      onClick={() => downloadImage(lastGeneratedImage)}
                      size="sm"
                      variant="secondary"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      دانلود
                    </Button>
                    <Button asChild size="sm">
                      <Link
                        params={{ id: lastGeneratedImage.id }}
                        to="/image/$id"
                      >
                        مشاهده جزئیات
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-sm">گالری اخیر</h3>
                {Array.isArray(images) && images.length > 0 && (
                  <span className="text-muted-foreground text-xs">
                    {images.length} تصویر
                  </span>
                )}
              </div>

              {isLoadingImages ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton
                      className="h-28 w-full rounded-md"
                      key={`img-skel-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: gallery skeleton
                        i
                      }`}
                    />
                  ))}
                </div>
                // biome-ignore lint/style/noNestedTernary: gallery skeleton
              ) : Array.isArray(images) && images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                  {(images as unknown as GeneratedImage[]).map((img) => (
                    <Link key={img.id} params={{ id: img.id }} to="/image/$id">
                      <div className="group relative overflow-hidden rounded-md border">
                        <img
                          alt={img.prompt}
                          className="h-28 w-full bg-muted object-cover"
                          src={img.imageUrl}
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
                        <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="line-clamp-2 text-[11px] text-primary-foreground leading-snug">
                            {img.prompt}
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                aria-label="دانلود"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  downloadImage(img);
                                }}
                                size="icon"
                                variant="secondary"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>دانلود</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-md border border-dashed p-8 text-muted-foreground">
                  <div className="text-center">
                    <ImagePlus className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">{fa.imageGeneration.noImagesYet}</p>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* Right: Controls */}
          <aside className="md:col-span-5">
            <Card className="sticky top-4 p-4">
              <div className="space-y-4">
                {/* Quick Settings */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block font-medium text-sm"
                      htmlFor="size-select"
                    >
                      {fa.imageGeneration.size}
                    </label>
                    <div className="flex items-center gap-2">
                      <Select
                        onValueChange={handleSizeChange}
                        value={getSizeValue()}
                      >
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            aria-label="جابجایی ابعاد"
                            className="h-9 w-9"
                            onClick={swapDimensions}
                            size="icon"
                            variant="outline"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>جابجایی عرض و ارتفاع</TooltipContent>
                      </Tooltip>
                    </div>
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
                        setSettings((prev) => ({
                          ...prev,
                          sampler_name: value,
                        }))
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
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            setSettings((prev) => ({
                              ...prev,
                              cfg_scale: value,
                            }))
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
                      onKeyDown={onPromptKeyDown}
                      placeholder={fa.imageGeneration.promptPlaceholder}
                      value={prompt}
                    />
                    <p className="mt-1 text-muted-foreground text-xs">
                      برای تولید از ⌘/Ctrl + Enter استفاده کنید
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

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      disabled={
                        isGenerating || !prompt.trim() || !isServiceAvailable
                      }
                      onClick={handleGenerate}
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <ImagePlus className="ml-2 h-4 w-4 animate-pulse" />
                          {fa.imageGeneration.generatingButton}
                        </>
                      ) : (
                        <>
                          <Send className="ml-2 h-4 w-4" />
                          {fa.imageGeneration.generateButton}
                        </>
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="بازنشانی تنظیمات"
                          className="h-10 w-10"
                          onClick={resetSettings}
                          size="icon"
                          variant="outline"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>بازنشانی</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
