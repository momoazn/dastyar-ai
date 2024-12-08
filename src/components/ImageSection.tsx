import { Download, ImagePlus } from "lucide-react";
import { useState } from "react";
import {
  ImageGenerationParams,
  StableDiffusionService,
} from "../services/stableDiffusion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ImageSectionProps {
  sdService: StableDiffusionService;
}

export const ImageSection: React.FC<ImageSectionProps> = ({ sdService }) => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [settings, setSettings] = useState<ImageGenerationParams>({
    prompt: "",
    steps: 20,
    guidanceScale: 7.5,
    sampler_index: "Euler",
    width: 512,
    height: 512,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const image = await sdService.generateImage({
        ...settings,
        prompt,
      });
      setGeneratedImages((prev) => [image, ...prev]);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      <div className="w-96 space-y-6 overflow-y-auto border-l border-border bg-background p-6 backdrop-blur-sm">
        <div className="space-y-6">
          <Card className="border-border bg-background">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-foreground">
                تنظیمات تصویر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  توضیحات
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                  dir="auto"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  تعداد مراحل
                </label>
                <Slider
                  value={[settings.steps]}
                  onValueChange={(value) =>
                    setSettings({ ...settings, steps: value[0] })
                  }
                  min={1}
                  max={50}
                  step={1}
                  className="py-4"
                />
                <span className="text-sm text-foreground">
                  {settings.steps}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    عرض
                  </label>
                  <Select
                    value={settings.width?.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, width: parseInt(value) })
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
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    ارتفاع
                  </label>
                  <Select
                    value={settings.height?.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, height: parseInt(value) })
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
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full gap-2 bg-primary hover:bg-primary/80"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            <ImagePlus className="h-5 w-5" />
            <span>{generating ? "در حال ایجاد..." : "ایجاد تصویر"}</span>
          </Button>
        </div>
      </div>

      {/* Generated Images Gallery */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6">
          {generatedImages?.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-xl bg-background"
            >
              <img
                src={image}
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
                    link.href = image;
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
      </div>
    </div>
  );
};
