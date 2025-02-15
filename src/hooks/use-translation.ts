import { useState } from "react";
import { useServices } from "../context/service-context";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const { ollamaService } = useServices();

  const translate = async (
    text: string,
    options: TranslationOptions,
    ollamaModel: string,
  ): Promise<string> => {
    if (!text || !ollamaService) return "";

    setIsTranslating(true);
    try {
      const prompt = `Instructions: You are a skilled translator. Translate the following text from ${options.sourceLang} to ${options.targetLang} using a ${options.tone} tone. Maintain the original meaning while adapting the translation to be culturally appropriate for the target language. Only respond with the translation, do not include any explanations or additional text.\n\nText to translate:\n${text}`;

      const response = await ollamaService.chat(prompt, ollamaModel);

      if (response.includes("</think>")) {
        return response.split("</think>")[1];
      }

      return response || "";
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
