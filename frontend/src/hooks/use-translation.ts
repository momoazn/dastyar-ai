import { useGetDefaultTranslationModel } from "@/atoms";
import { translate as translateRequest } from "@/lib/api/translate";
import { useState } from "react";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const defaultTranslationModel = useGetDefaultTranslationModel();

  const translate = async (
    text: string,
    projectId: number,
    options: TranslationOptions,
  ): Promise<string> => {
    if (!text) return "";

    setIsTranslating(true);
    try {
      const response = await translateRequest(projectId, {
        input: text,
        model: defaultTranslationModel || "",
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
