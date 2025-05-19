import { useEffect } from "react";
import { useAIModels } from "../lib/api";
import {
  useGetDefaultChatModel,
  useGetDefaultTranslationModel,
  useSetDefaultTranslationModel,
  useSetDefaultChatModel,
} from "@/atoms";

/**
 * Hook that initializes selected models on application startup
 * Sets default models if none are selected
 */
export function useInitializeSelectedModels() {
  // Get current model selections
  const defaultChatModel = useGetDefaultChatModel();
  const defaultTranslationModel = useGetDefaultTranslationModel();

  // Get setter functions
  const setDefaultChatModel = useSetDefaultChatModel();
  const setDefaultTranslationModel = useSetDefaultTranslationModel();

  // Fetch available models
  const { data: chatModels, isSuccess } = useAIModels();

  useEffect(() => {
    // Only proceed if we have successfully loaded chat models
    if (!isSuccess || !chatModels?.data?.length) {
      return;
    }

    const defaultModel = chatModels.data[0].name;

    // Set chat model if not already set
    if (!defaultChatModel) {
      setDefaultChatModel(defaultModel);
    }

    // Set translation model if not already set
    if (!defaultTranslationModel) {
      setDefaultTranslationModel(defaultModel);
    }
  }, [
    isSuccess,
    chatModels,
    defaultChatModel,
    defaultTranslationModel,
    setDefaultChatModel,
    setDefaultTranslationModel,
  ]);
}
