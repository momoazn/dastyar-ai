import { useState } from "react";
import { sendMessage } from "@/lib/api/chat";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

const getLanguageFullName = (langCode: string): string => {
  const languageMap: Record<string, string> = {
    persian: "Persian (Farsi)",
    english: "English",
    arabic: "Modern Standard Arabic",
    french: "French",
    german: "German",
    spanish: "Spanish",
  };
  return languageMap[langCode] || langCode;
};

const getToneDescription = (tone: string): string => {
  const toneDescriptions: Record<string, string> = {
    formal: "formal and professional",
    casual: "casual and conversational",
    technical: "technical and precise",
    friendly: "friendly and approachable",
  };
  return toneDescriptions[tone] || tone;
};

const getSystemPrompt = (
  sourceLanguage: string,
  targetLanguage: string,
  toneStyle: string,
  text: string,
) => {
  return `You are a highly skilled professional translator with expertise in ${sourceLanguage} and ${targetLanguage}. 
Your task is to translate the provided text:
- From: ${sourceLanguage}
- To: ${targetLanguage}
- Style: ${toneStyle}

Guidelines:
1. Maintain accurate meaning and context
2. Adapt cultural references appropriately
3. Use ${toneStyle} language
4. Preserve formatting and structure
5. Only respond with the translation
6. Do not include explanations or notes

Text to translate:
${text}`;
};

export function useTranslation(threadId: number) {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (
    text: string,
    model: string,
    options: TranslationOptions,
  ): Promise<string> => {
    if (!text) return "";

    const sourceLanguage = getLanguageFullName(options.sourceLang);
    const targetLanguage = getLanguageFullName(options.targetLang);
    const toneStyle = getToneDescription(options.tone);

    setIsTranslating(true);
    try {
      const response = await sendMessage(
        threadId,
        getSystemPrompt(sourceLanguage, targetLanguage, toneStyle, text),
        model,
        false,
      );

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
