import { createFileRoute } from '@tanstack/react-router';
import { Download, ImagePlus, Send, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from '@/components/ui';
import type { ImageGenerationParams } from '@/hooks/use-image-generation';
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
});

function ImageRouteComponent() {
  return (
    <main className="flex h-full flex-col">
      <ImageSection />
    </main>
  );
}

export function ImageSection() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [settings, setSettings] =
    useState<Omit<ImageGenerationParams, 'prompt'>>(DEFAULT_SETTINGS);

  const {
    images,
    samplers,
    isGenerating,
    isServiceAvailable,
    generateImage,
    clearHistory,
    deleteImage,
    downloadImage,
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
    <div className="flex h-full flex-col">
      {/* Loading Overlay */}
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

      {/* Service Status */}
      {!isServiceAvailable && (
        <Alert className="mx-6 mb-4">
          <AlertDescription>
            {fa.imageGeneration.serviceUnavailableAlert}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mx-6 mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg">{fa.imageGeneration.title}</h2>
        {images.length > 0 && (
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

      {/* Generated Images */}
      <ScrollArea className="mx-6 mb-6 flex-1 rounded-lg border">
        {images.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <ImagePlus className="mx-auto mb-3 h-12 w-12" />
              <p className="text-sm">{fa.imageGeneration.noImagesYet}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
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
                  <div className="flex gap-3">
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
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3">
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
      <Card className="mx-6 mb-6 p-6">
        {/* Settings Grid */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
            <label className="mb-3 block font-medium text-sm" htmlFor="size">
              {fa.imageGeneration.size}
            </label>
            <Select onValueChange={handleSizeChange} value={getSizeValue()}>
              <SelectTrigger className="h-10">
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
            <label className="mb-3 block font-medium text-sm" htmlFor="sampler">
              {fa.imageGeneration.sampler}
            </label>
            <Select
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, sampler_name: value }))
              }
              value={settings.sampler_name}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {samplers.map((sampler) => (
                  <SelectItem key={sampler} value={sampler}>
                    {sampler}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="mb-3 block font-medium text-sm"
              htmlFor="cfg-scale"
            >
              {fa.imageGeneration.cfgScale}: {settings.cfg_scale}
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
            <label className="mb-3 block font-medium text-sm" htmlFor="steps">
              {fa.imageGeneration.steps.replace(
                '{steps}',
                String(settings.steps)
              )}
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
        <div className="space-y-4">
          <div>
            <label className="mb-3 block font-medium text-sm" htmlFor="prompt">
              {fa.imageGeneration.promptLabel}
            </label>
            <Textarea
              className="min-h-[90px] resize-none"
              dir="auto"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={fa.imageGeneration.promptPlaceholder}
              value={prompt}
            />
          </div>

          <div>
            <label
              className="mb-3 block font-medium text-sm"
              htmlFor="negative-prompt"
            >
              {fa.imageGeneration.negativePromptLabel}
            </label>
            <Textarea
              className="min-h-[70px] resize-none"
              dir="auto"
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder={fa.imageGeneration.negativePromptPlaceholder}
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
      </Card>
    </div>
  );
}
