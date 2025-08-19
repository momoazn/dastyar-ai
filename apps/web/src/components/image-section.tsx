import { Download, ImagePlus, Send, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Progress,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from '@/components/ui';
import { useImageGeneration } from '@/hooks/use-image-generation';
import type { ImageGenerationParams } from '@/lib/stable-diffusion';

const DEFAULT_SETTINGS: Omit<ImageGenerationParams, 'prompt'> = {
  steps: 20,
  cfg_scale: 7.5,
  negative_prompt: '',
  sampler_name: 'Euler a',
  width: 512,
  height: 512,
};

const SAMPLERS = [
  'Euler',
  'Euler a',
  'LMS',
  'Heun',
  'DPM2',
  'DPM2 a',
  'DPM++ 2S a',
  'DPM++ 2M',
  'DPM++ SDE',
  'DPM++ 2M Karras',
  'DPM++ SDE Karras',
  'LMS Karras',
] as const;

const IMAGE_SIZES = [
  { label: '512×512', value: 512 },
  { label: '768×768', value: 768 },
  { label: '1024×1024', value: 1024 },
  { label: '512×768', value: '512x768' },
  { label: '768×512', value: '768x512' },
] as const;

export function ImageSection() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);

  const {
    images,
    isGenerating,
    progress,
    isServiceAvailable,
    generateImage,
    clearHistory,
    deleteImage,
    downloadImage,
  } = useImageGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('لطفاً توضیحات تصویر را وارد کنید');
      return;
    }

    if (!isServiceAvailable) {
      toast.error(
        'سرویس Stable Diffusion در دسترس نیست. لطفاً مطمئن شوید که A1111 در حال اجرا است.'
      );
      return;
    }

    await generateImage({
      ...settings,
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
    });
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
    <div className="flex h-full flex-col gap-4">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-[300px] p-6">
            <div className="space-y-4 text-center">
              <ImagePlus className="mx-auto h-12 w-12 animate-pulse text-primary" />
              <div>
                <h3 className="font-semibold">در حال تولید تصویر...</h3>
                <p className="text-muted-foreground text-sm">
                  لطفاً صبر کنید، این کار ممکن است چند دقیقه طول بکشد
                </p>
              </div>
              <div className="space-y-2">
                <Progress className="w-full" value={progress} />
                <p className="text-muted-foreground text-xs">
                  {Math.round(progress)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Service Status */}
      {!isServiceAvailable && (
        <Alert className="mx-4">
          <AlertDescription>
            سرویس Stable Diffusion در دسترس نیست. لطفاً A1111 را در پورت 7860
            راه‌اندازی کنید.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mx-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">تولید تصویر</h2>
        {images.length > 0 && (
          <Button
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={clearHistory}
            size="sm"
            variant="outline"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            پاک کردن همه
          </Button>
        )}
      </div>

      {/* Generated Images */}
      <ScrollArea className="mx-4 flex-1 rounded-md border">
        {images.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ImagePlus className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">هنوز تصویری تولید نشده است</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
                key={image.id}
              >
                <img
                  alt={image.prompt}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  src={image.url}
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
        )}
      </ScrollArea>

      {/* Generation Controls */}
      <Card className="mx-4 p-4">
        {/* Settings Grid */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="size">
              اندازه
            </label>
            <Select onValueChange={handleSizeChange} value={getSizeValue()}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((size) => (
                  <SelectItem key={size.label} value={size.value.toString()}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="sampler">
              سمپلر
            </label>
            <Select
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, sampler_name: value }))
              }
              value={settings.sampler_name}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLERS.map((sampler) => (
                  <SelectItem key={sampler} value={sampler}>
                    {sampler}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="cfg-scale"
            >
              <span className="sr-only">مقیاس راهنمایی</span>
              {settings.cfg_scale}
            </label>
            <Slider
              className="w-full"
              max={30}
              min={1}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, cfg_scale: value }))
              }
              step={0.5}
              value={[settings.cfg_scale]}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="steps">
              تعداد گام‌ها: {settings.steps}
            </label>
            <Slider
              className="w-full"
              max={150}
              min={1}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, steps: value }))
              }
              step={1}
              value={[settings.steps]}
            />
          </div>
        </div>

        {/* Prompt Inputs */}
        <div className="space-y-3">
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="prompt">
              توضیحات تصویر
            </label>
            <Textarea
              className="min-h-[80px] resize-none"
              dir="auto"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
              value={prompt}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm">
              پرامپت منفی (اختیاری)
            </label>
            <Textarea
              className="min-h-[60px] resize-none"
              dir="auto"
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="مواردی که نمی‌خواهید در تصویر باشد..."
              value={negativePrompt}
            />
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
                در حال تولید...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                تولید تصویر
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
