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
      const images = await sdService.generateImage({
        ...settings,
        prompt: prompt,
      });
      setGeneratedImages((prev) => [...images, ...prev]);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setGenerating(false);
  };

  return (
    <div className="flex h-full">
      {/* Settings Panel */}
      <div className="w-96 border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm p-6 space-y-6 overflow-y-auto">
        <div className="space-y-6">
          <Card className="border-gray-800 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-100">
                تنظیمات تصویر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  توضیحات
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="توضیحات تصویر مورد نظر خود را وارد کنید..."
                  className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  dir="auto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                <span className="text-sm text-gray-400">{settings.steps}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    عرض
                  </label>
                  <Select
                    value={settings.width?.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, width: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {[256, 512, 768, 1024].map((size) => (
                        <SelectItem
                          key={size}
                          value={size.toString()}
                          className="text-gray-100 focus:bg-gray-700"
                        >
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ارتفاع
                  </label>
                  <Select
                    value={settings.height?.toString()}
                    onValueChange={(value) =>
                      setSettings({ ...settings, height: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {[256, 512, 768, 1024].map((size) => (
                        <SelectItem
                          key={size}
                          value={size.toString()}
                          className="text-gray-100 focus:bg-gray-700"
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
            className="w-full gap-2 bg-blue-600 hover:bg-blue-500"
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
          >
            <ImagePlus className="w-5 h-5" />
            <span>{generating ? "در حال ایجاد..." : "ایجاد تصویر"}</span>
          </Button>
        </div>
      </div>

      {/* Generated Images Gallery */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6">
          {generatedImages?.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800"
            >
              <img
                src={image}
                alt={`Generated ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = image;
                    link.download = `generated-${index + 1}.png`;
                    link.click();
                  }}
                >
                  <Download className="w-6 h-6" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
