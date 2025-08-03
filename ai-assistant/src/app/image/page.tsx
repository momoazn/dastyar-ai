"use client";

import React, { useCallback, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { ImageIcon, Download, Wand2 } from "lucide-react";

interface ImageSettings {
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  sampler: string;
}

const imageSizes = [
  { label: "512×512", width: 512, height: 512 },
  { label: "768×512", width: 768, height: 512 },
  { label: "512×768", width: 512, height: 768 },
  { label: "1024×768", width: 1024, height: 768 },
  { label: "768×1024", width: 768, height: 1024 },
];

const samplers = [
  { value: "DPM++ 2M Karras", label: "DPM++ 2M Karras" },
  { value: "Euler a", label: "Euler a" },
  { value: "Euler", label: "Euler" },
  { value: "LMS", label: "LMS" },
  { value: "Heun", label: "Heun" },
  { value: "DPM2", label: "DPM2" },
];

export default function ImagePage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [settings, setSettings] = useState<ImageSettings>({
    width: 512,
    height: 512,
    steps: 20,
    guidanceScale: 7.5,
    sampler: "DPM++ 2M Karras",
  });

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    // Mock image generation
    setTimeout(() => {
      // Mock generated image URL
      setGeneratedImage(
        `https://picsum.photos/${settings.width}/${settings.height}?random=${Date.now()}`,
      );
      setIsGenerating(false);
    }, 3000);
  }, [prompt, settings]);

  const handleSizeChange = useCallback((sizeLabel: string) => {
    const size = imageSizes.find((s) => s.label === sizeLabel);
    if (size) {
      setSettings((prev) => ({
        ...prev,
        width: size.width,
        height: size.height,
      }));
    }
  }, []);

  const currentSizeLabel =
    imageSizes.find(
      (s) => s.width === settings.width && s.height === settings.height,
    )?.label || "پیشفرض";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar side="right" />
      <SidebarInset>
        <Header SideBarTrigger={<SidebarTrigger />} />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="text-primary size-6" />
                <h1 className="text-2xl font-bold">
                  {PERSIAN_TEXTS.navigation.imageGeneration}
                </h1>
              </div>
              <p className="text-muted-foreground">
                تصاویر زیبا و با کیفیت از روی توضیحات متنی بسازید
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Settings Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تنظیمات تولید</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image Size */}
                    <div className="space-y-2">
                      <Label>
                        {PERSIAN_TEXTS.imageSettings.width} ×{" "}
                        {PERSIAN_TEXTS.imageSettings.height}
                      </Label>
                      <Select
                        value={currentSizeLabel}
                        onValueChange={handleSizeChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {imageSizes.map((size) => (
                            <SelectItem key={size.label} value={size.label}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sampler */}
                    <div className="space-y-2">
                      <Label>{PERSIAN_TEXTS.imageSettings.sampler}</Label>
                      <Select
                        value={settings.sampler}
                        onValueChange={(value) =>
                          setSettings((prev) => ({ ...prev, sampler: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {samplers.map((sampler) => (
                            <SelectItem
                              key={sampler.value}
                              value={sampler.value}
                            >
                              {sampler.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <Label>
                        {PERSIAN_TEXTS.imageSettings.steps}: {settings.steps}
                      </Label>
                      <Slider
                        value={[settings.steps]}
                        onValueChange={([value]) =>
                          setSettings((prev) => ({ ...prev, steps: value }))
                        }
                        max={50}
                        min={10}
                        step={1}
                      />
                    </div>

                    {/* Guidance Scale */}
                    <div className="space-y-2">
                      <Label>
                        {PERSIAN_TEXTS.imageSettings.guidanceScale}:{" "}
                        {settings.guidanceScale}
                      </Label>
                      <Slider
                        value={[settings.guidanceScale]}
                        onValueChange={([value]) =>
                          setSettings((prev) => ({
                            ...prev,
                            guidanceScale: value,
                          }))
                        }
                        max={20}
                        min={1}
                        step={0.5}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Sample Prompts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">نمونه درخواست‌ها</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        "یک منظره زیبا از کوه‌های برفی در غروب",
                        "گربه‌ای در حال بازی در باغ پر از گل",
                        "شهر مدرن در شب با نور‌های رنگی",
                        "دریا و موج‌های آرام در صبح زود",
                        "جنگل پاییزی با برگ‌های طلایی",
                      ].map((samplePrompt, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground h-auto justify-start p-2 text-right text-sm"
                          onClick={() => setPrompt(samplePrompt)}
                        >
                          {samplePrompt}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Prompt Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">توضیح تصویر</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>درخواست اصلی</Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="توضیح دقیق تصویری که می‌خواهید تولید شود..."
                        className="min-h-24 resize-none"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>درخواست منفی (اختیاری)</Label>
                      <Textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="چیزهایی که نمی‌خواهید در تصویر باشد..."
                        className="min-h-16 resize-none"
                        dir="rtl"
                      />
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      size="lg"
                      className="w-full"
                    >
                      <Wand2 className="ml-2 size-4" />
                      {isGenerating ? "در حال تولید..." : "تولید تصویر"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generated Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تصویر تولید شده</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted mx-auto flex aspect-square max-w-lg items-center justify-center rounded-lg">
                      {isGenerating ? (
                        <div className="space-y-4 text-center">
                          <div className="border-primary mx-auto size-8 animate-spin rounded-full border-2 border-t-transparent" />
                          <p className="text-muted-foreground text-sm">
                            در حال تولید تصویر...
                          </p>
                        </div>
                      ) : generatedImage ? (
                        <div className="space-y-4">
                          <img
                            src={generatedImage}
                            alt="Generated artwork"
                            className="max-h-96 max-w-full rounded-lg object-contain"
                          />
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="ml-2 size-4" />
                              دانلود
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleGenerate}
                            >
                              <Wand2 className="ml-2 size-4" />
                              تولید مجدد
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-center">
                          <ImageIcon className="text-muted-foreground mx-auto size-12" />
                          <p className="text-muted-foreground text-sm">
                            تصویر تولید شده اینجا نمایش داده می‌شود
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
