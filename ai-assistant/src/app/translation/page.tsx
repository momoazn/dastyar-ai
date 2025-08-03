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
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { Languages, ArrowRightLeft } from "lucide-react";

interface Language {
  code: string;
  name: string;
}

interface Tone {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: "persian", name: PERSIAN_TEXTS.languages.persian },
  { code: "english", name: PERSIAN_TEXTS.languages.english },
  { code: "arabic", name: PERSIAN_TEXTS.languages.arabic },
  { code: "french", name: PERSIAN_TEXTS.languages.french },
  { code: "german", name: PERSIAN_TEXTS.languages.german },
  { code: "spanish", name: PERSIAN_TEXTS.languages.spanish },
];

const tones: Tone[] = [
  { code: "formal", name: PERSIAN_TEXTS.tones.formal },
  { code: "casual", name: PERSIAN_TEXTS.tones.casual },
  { code: "technical", name: PERSIAN_TEXTS.tones.technical },
  { code: "friendly", name: PERSIAN_TEXTS.tones.friendly },
  { code: "academic", name: PERSIAN_TEXTS.tones.academic },
  { code: "business", name: PERSIAN_TEXTS.tones.business },
  { code: "creative", name: PERSIAN_TEXTS.tones.creative },
  { code: "neutral", name: PERSIAN_TEXTS.tones.neutral },
];

export default function TranslationPage() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("english");
  const [targetLanguage, setTargetLanguage] = useState("persian");
  const [tone, setTone] = useState("formal");
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = useCallback(() => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    // Mock translation
    setTimeout(() => {
      const mockTranslations = {
        "Hello, how are you?": "سلام، حال شما چطور است؟",
        "Good morning": "صبح بخیر",
        "Thank you": "متشکرم",
        "How can I help you?": "چگونه می‌توانم به شما کمک کنم؟",
      };

      const translation =
        mockTranslations[sourceText as keyof typeof mockTranslations] ||
        `ترجمه ${sourceText} به ${languages.find((l) => l.code === targetLanguage)?.name}`;

      setTranslatedText(translation);
      setIsTranslating(false);
    }, 1500);
  }, [sourceText, targetLanguage]);

  const handleSwapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  }, [sourceLanguage, targetLanguage, sourceText, translatedText]);

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
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <Languages className="text-primary size-6" />
                <h1 className="text-2xl font-bold">
                  {PERSIAN_TEXTS.navigation.translation}
                </h1>
              </div>
              <p className="text-muted-foreground">
                ترجمه متن‌های خود با کیفیت بالا و لحن مناسب
              </p>
            </div>

            {/* Translation Controls */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Source Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {PERSIAN_TEXTS.translation.sourceLanguage}
                </label>
                <Select
                  value={sourceLanguage}
                  onValueChange={setSourceLanguage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="flex items-end justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSwapLanguages}
                  className="size-10"
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
              </div>

              {/* Target Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {PERSIAN_TEXTS.translation.targetLanguage}
                </label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {PERSIAN_TEXTS.translation.translationTone}
              </label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((toneItem) => (
                    <SelectItem key={toneItem.code} value={toneItem.code}>
                      {toneItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Translation Interface */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Source Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {languages.find((l) => l.code === sourceLanguage)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={PERSIAN_TEXTS.translation.enterText}
                    className="min-h-32 resize-none"
                    dir={
                      sourceLanguage === "persian" ||
                      sourceLanguage === "arabic"
                        ? "rtl"
                        : "ltr"
                    }
                  />
                </CardContent>
              </Card>

              {/* Target Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {languages.find((l) => l.code === targetLanguage)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Textarea
                      value={translatedText}
                      placeholder={
                        isTranslating
                          ? PERSIAN_TEXTS.translation.translating
                          : PERSIAN_TEXTS.translation.translatedText
                      }
                      className="min-h-32 resize-none"
                      dir={
                        targetLanguage === "persian" ||
                        targetLanguage === "arabic"
                          ? "rtl"
                          : "ltr"
                      }
                      readOnly
                    />
                    {isTranslating && (
                      <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" />
                          <span className="text-sm">
                            {PERSIAN_TEXTS.translation.translating}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Translate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isTranslating}
                size="lg"
                className="px-8"
              >
                {isTranslating
                  ? PERSIAN_TEXTS.translation.translating
                  : PERSIAN_TEXTS.translation.translate}
              </Button>
            </div>

            {/* Sample Translations */}
            <Card>
              <CardHeader>
                <CardTitle>نمونه ترجمه‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">انگلیسی به فارسی:</p>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <p>Hello, how are you? → سلام، حال شما چطور است؟</p>
                      <p>Good morning → صبح بخیر</p>
                      <p>Thank you → متشکرم</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">فارسی به انگلیسی:</p>
                    <div className="text-muted-foreground space-y-1 text-sm">
                      <p>درود بر شما → Greetings to you</p>
                      <p>چطور می‌تونم کمکتون کنم؟ → How can I help you?</p>
                      <p>خوش آمدید → Welcome</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
