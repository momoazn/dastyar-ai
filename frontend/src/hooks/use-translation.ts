import { useGetTranslationModel } from "@/atoms";
import { translateMessage } from "@/lib/api/translate";
import { useState } from "react";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const translationModel = useGetTranslationModel();

  const translate = async (
    text: string,
    threadId: number,
    options: TranslationOptions,
  ): Promise<string> => {
    if (!text) return "";

    setIsTranslating(true);
    try {
      const response = await translateMessage(threadId, {
        input: text,
        model: translationModel,
        source_lang: options.sourceLang,
        target_lang: options.targetLang,
        tone: options.tone,
      });

      return response.translated_text.trim();
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
