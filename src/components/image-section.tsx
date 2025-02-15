import { useServices } from "@/context/service-context";
import { useImageSettings } from "@/hooks/use-image-settings";
import { Download, ImagePlus, Mic, Pause, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAudioRecording } from "../hooks/use-audio-recording";
import { useImageGeneration } from "../hooks/use-image-generation";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

export const ImageSection = () => {
  const { sdService } = useServices();
  const { settings } = useImageSettings();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setPrompt);

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

      <div className="mx-4 p-4">
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
      </div>
    </div>
  );
};
