import { translateMessage } from "@/lib/api/chat";
import { useState } from "react";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

export function useTranslation(threadId: number) {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (
    text: string,
    model: string,
    options: TranslationOptions,
  ): Promise<string> => {
    if (!text) return "";

    setIsTranslating(true);
    try {
      const response = await translateMessage(threadId, {
        content: text,
        model,
        source_lang: options.sourceLang,
        target_lang: options.targetLang,
        tone: options.tone,
      });

      return response.content.trim();
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translate,
    isTranslating,
  };
}
