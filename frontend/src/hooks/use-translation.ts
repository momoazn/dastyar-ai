import { useGetDefaultTranslationModel } from "@/atoms";
import { useCreateTranslation } from "../../generated/apiComponents";

interface TranslationOptions {
  sourceLang: string;
  targetLang: string;
  tone: string;
}

export function useTranslate() {
  const defaultTranslationModel = useGetDefaultTranslationModel();
  const createTranslationMutation = useCreateTranslation();

  const translate = async (
    text: string,
    options: TranslationOptions,
  ): Promise<string> => {
    if (!text) return "";

    try {
      const response = await createTranslationMutation.mutateAsync({
        body: {
          source_text: text,
          model: defaultTranslationModel || "",
          source_language: options.sourceLang,
          target_language: options.targetLang,
          tone: options.tone,
          thread_id: "0", // Default thread ID for standalone translations
        },
      });

      return response.data?.translated_text?.trim() || "";
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error("Translation failed. Please try again.");
    }
  };

  return {
    translate,
    isTranslating: createTranslationMutation.isPending,
  };
}
