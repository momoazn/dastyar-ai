import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ImagePlus,
  Maximize2,
  Send,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogTrigger,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type {
  GeneratedImage,
  ImageGenerationParams,
} from '@/hooks/use-image-generation';
import { useImageGeneration } from '@/hooks/use-image-generation';
import { fa } from '@/lib/persian-texts';

const DEFAULT_SETTINGS: Omit<ImageGenerationParams, 'prompt'> = {
  steps: 20,
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
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return {
      id: search.id as string | undefined,
    };
  },
});

function ImageRouteComponent() {
  const { id } = useSearch({ from: '/image' });
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  const {
    images,
    samplers,
    isServiceAvailable,
    clearHistory,
    deleteImage,
    downloadImage,
    isLoadingImages,
    generateImage,
    isGenerating,
  } = useImageGeneration();

  if (id) {
    const imagesArray = Array.isArray(images)
      ? (images as unknown as GeneratedImage[])
      : [];
    const image = imagesArray.find((img) => img.id === id);
    const currentIndex = imagesArray.findIndex((img) => img.id === id);

    const goToPrevious = () => {
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : imagesArray.length - 1;
      const prevImage = imagesArray[prevIndex];
      if (prevImage) {
        navigate({ to: '/image', search: { id: prevImage.id } });
      }
    };

    const goToNext = () => {
      const nextIndex =
        currentIndex < imagesArray.length - 1 ? currentIndex + 1 : 0;
      const nextImage = imagesArray[nextIndex];
      if (nextImage) {
        navigate({ to: '/image', search: { id: nextImage.id } });
      }
    };

    const handleDownload = () => {
      if (image) {
        const link = document.createElement('a');
        link.href = `/api/images/${image.id}/download`;
        link.download = `image-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) {
        return 'نامشخص';
      }
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <main className="container mx-auto h-full max-w-7xl p-4">
        <div className="flex h-full gap-6">
          {/* Image Preview Section */}
          <div className="flex flex-1 flex-col">
            {(() => {
              if (image) {
                return (
                  <>
                    {/* Image Navigation Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          disabled={imagesArray.length <= 1}
                          onClick={goToPrevious}
                          size="sm"
                          variant="outline"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-muted-foreground text-sm">
                          {currentIndex + 1} از {imagesArray.length}
                        </span>
                        <Button
                          disabled={imagesArray.length <= 1}
                          onClick={goToNext}
                          size="sm"
                          variant="outline"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Maximize2 className="mr-2 h-4 w-4" />
                              تمام صفحه
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="h-full max-h-[95vh] w-full max-w-[95vw] p-2">
                            <img
                              alt={image.prompt}
                              className="h-full w-full rounded-lg object-contain"
                              src={image.imageUrl}
                            />
                          </DialogContent>
                        </Dialog>

                        <Button
                          onClick={handleDownload}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          دانلود
                        </Button>

                        <Button
                          onClick={() => deleteImage(image.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          حذف
                        </Button>
                      </div>
                    </div>

                    {/* Main Image */}
                    <div className="mb-4 flex flex-1 items-center justify-center rounded-lg bg-muted/30 p-4">
                      <img
                        alt={image.prompt}
                        className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                        src={image.imageUrl}
                      />
                    </div>
                  </>
                );
              }
              if (isLoadingImages || isGenerating) {
                return (
                  <div className="flex flex-1 items-center justify-center">
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
                );
              }
              return (
                <div className="flex flex-1 items-center justify-center">
                  <Alert>
                    <AlertDescription>
                      تصویر مورد نظر یافت نشد.
                    </AlertDescription>
                  </Alert>
                </div>
              );
            })()}
          </div>

          {/* Metadata Panel */}
          {image && (
            <Card className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">جزئیات تصویر</h3>
                  <Badge variant="outline">
                    <Eye className="mr-1 h-3 w-3" />
                    در حال مشاهده
                  </Badge>
                </div>

                {/* Prompt */}
                <div>
                  <h4 className="mb-2 font-medium">دستور تولید</h4>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm leading-relaxed">{image.prompt}</p>
                  </div>
                </div>

                {/* Negative Prompt */}
                {image.negativePrompt && (
                  <div>
                    <h4 className="mb-2 font-medium">دستور منفی</h4>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm leading-relaxed">
                        {image.negativePrompt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Creation Date */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(image.createdAt)}</span>
                </div>

                {/* Settings */}
                {image.settings && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        className="w-full justify-between"
                        size="sm"
                        variant="outline"
                      >
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          تنظیمات تولید
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مراحل:</span>
                          <span>{image.settings?.steps || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            CFG Scale:
                          </span>
                          <span>{image.settings?.cfg_scale || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            نمونه‌گیر:
                          </span>
                          <span>{image.settings?.sampler_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">اندازه:</span>
                          <span>
                            {image.settings?.width || 'N/A'}×
                            {image.settings?.height || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </Card>
          )}
        </div>
      </main>
    );
  }

  const handleGenerate = () => {
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
    generateImage(params);

    // Navigate to a new image when generation completes
    // The hook will handle the success/error states and toasts
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

        <ScrollArea className="flex-1 rounded-lg border">
          {(() => {
            const imagesArray = Array.isArray(images)
              ? (images as unknown as GeneratedImage[])
              : [];
            if (isLoadingImages && imagesArray.length === 0) {
              return (
                <div className="flex h-48 items-center justify-center">
                  <LoadingSpinner />
                </div>
              );
            }
            if (imagesArray.length === 0) {
              return (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ImagePlus className="mx-auto mb-3 h-12 w-12" />
                    <p className="text-sm">{fa.imageGeneration.noImagesYet}</p>
                  </div>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {imagesArray.map((image: GeneratedImage) => (
                  <div
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted shadow-sm"
                    key={image.id}
                  >
                    <img
                      alt={image.prompt}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={image.imageUrl}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => downloadImage(image)}
                          size="sm"
                          variant="secondary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteImage(image.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="line-clamp-2 text-white text-xs">
                        {image.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </ScrollArea>

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
