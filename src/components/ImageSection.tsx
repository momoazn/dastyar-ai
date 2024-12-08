import { useServices } from "@/context/ServiceContext";
import { Download, ImagePlus, Mic, Pause, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useImageGeneration } from "../hooks/useImageGeneration";
import { ImageGenerationParams } from "../services/stableDiffusion";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

const samplers = [
  "Euler",
  "Euler a",
  "LMS",
  "Heun",
  "DPM2",
  "DPM2 a",
  "DPM++ 2S a",
  "DPM++ 2M",
  "DPM++ SDE",
  "DPM fast",
  "DPM adaptive",
  "LMS Karras",
  "DPM2 Karras",
  "DPM2 a Karras",
  "DPM++ 2S a Karras",
  "DPM++ 2M Karras",
  "DPM++ SDE Karras",
] as const;

export const ImageSection = () => {
  const { sdService } = useServices();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [settings, setSettings] = useState<ImageGenerationParams>({
    prompt: "",
    steps: 10,
    guidanceScale: 5,
    negativePrompt: "",
    sampler_index: "Euler",
    width: 512,
    height: 512,
  });

  const { isRecording, startRecording, stopRecording } = useAudioRecording(
    (text) => setPrompt(text),
  );

  const { images, generating, generateImage, clearHistory } =
    useImageGeneration(sdService);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    await generateImage({ ...settings, prompt, negativePrompt });
  };

  return (
    <div className="flex h-full flex-col gap-2 pt-4">
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <Alert>
              <AlertDescription className="text-center">
                در حال ایجاد تصویر...
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      <div className="mx-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">تصاویر ایجاد شده</h2>
        {images.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearHistory}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="mx-4 flex-1 rounded-md border p-4">
        <div className="grid grid-cols-2 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-xl bg-background"
            >
              <img
                src={image.url}
                alt={`Generated ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-background hover:bg-white/20 hover:text-background"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = image.url;
                    link.download = `generated-${index + 1}.png`;
                    link.click();
                  }}
                >
                  <Download className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Card className="mx-4 p-4">
        <div className="grid grid-cols-2 gap-4 pb-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              اندازه
            </label>
            <Select
              value={settings.width.toString()}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  width: parseInt(value),
                  height: parseInt(value),
                })
              }
            >
              <SelectTrigger className="border-border bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-background">
                {[256, 512, 768, 1024].map((size) => (
                  <SelectItem
                    key={size}
                    value={size.toString()}
                    className="text-foreground focus:bg-foreground focus:text-background"
                  >
                    {size}x{size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              سمپلر
            </label>
            <Select
              value={settings.sampler_index}
              onValueChange={(value) =>
                setSettings({
                  ...settings,
                  sampler_index: value as typeof settings.sampler_index,
                })
              }
            >
              <SelectTrigger className="border-border bg-background text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-background">
                {samplers.map((sampler) => (
                  <SelectItem
                    key={sampler}
                    value={sampler}
                    className="text-foreground focus:bg-foreground focus:text-background"
                  >
                    {sampler}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              مقیاس راهنمایی
            </label>
            <Slider
              value={[settings.guidanceScale]}
              onValueChange={(value) =>
                setSettings({ ...settings, guidanceScale: value[0] })
              }
              min={1}
              max={20}
              step={0.1}
              className="py-4"
            />
            <span className="text-sm text-foreground">
              {settings.guidanceScale.toFixed(1)}
            </span>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              گام‌ها
            </label>
            <Slider
              value={[settings.steps]}
              onValueChange={(value) =>
                setSettings({ ...settings, steps: value[0] })
              }
              min={1}
              max={150}
              step={1}
              className="py-4"
            />
            <span className="text-sm text-foreground">{settings.steps}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground"
              dir="auto"
            />
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="پرامپت منفی..."
              className="border-border bg-background text-foreground placeholder:text-muted-foreground"
              dir="auto"
            />
          </div>

          <div className="flex flex-col gap-2 self-end">
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <ImagePlus className="h-4 w-4 animate-pulse" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
