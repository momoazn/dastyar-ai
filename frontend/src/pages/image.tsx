import { Download, ImagePlus, Mic, Pause, Send, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  ScrollArea,
  Textarea,
} from "@/components/ui";
import {
  useAudioRecording,
  useImageGeneration,
  useImageSettings,
} from "@/hooks";
import { detectTextDirection } from "@/lib/utils";
import { StableDiffusionService } from "@/services/stable-diffusion";

export function ImagePage() {
  const sdService = useRef<StableDiffusionService>(
    new StableDiffusionService(),
  );

  const { settings } = useImageSettings();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setPrompt);

  const { images, generating, generateImage, clearHistory } =
    useImageGeneration(sdService.current);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    await generateImage({ ...settings, prompt, negativePrompt });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {generating && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="flex flex-col items-center gap-4">
            <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
            <Alert>
              <AlertDescription className="text-center">
                در حال ایجاد تصویر...
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <Button
          variant="outline"
          size="icon"
          onClick={clearHistory}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground self-end"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <ScrollArea className="bg-background flex-1 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group bg-background relative aspect-square overflow-hidden rounded-xl"
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
                  className="text-background hover:text-background hover:bg-white/20"
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

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            dir={prompt ? detectTextDirection(prompt) : "rtl"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <Textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="پرامپت منفی..."
            className="border-border bg-background text-foreground placeholder:text-muted-foreground"
            dir={negativePrompt ? detectTextDirection(negativePrompt) : "rtl"}
          />
        </div>

        <div className="flex flex-col gap-2 self-end">
          <Button
            size="icon"
            className="h-10 w-10"
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
            className="h-10 w-10"
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
    </div>
  );
}
