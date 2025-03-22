import { useEffect } from "react";
import {
  useGetChatModel,
  useGetTranslationModel,
  useSetChatModel,
  useSetTranslationModel,
} from "../atoms";
import { useChatModels } from "../lib/api/chat";

/**
 * Hook that initializes selected models on application startup
 * Sets default models if none are selected
 */
export function useInitializeSelectedModels() {
  // Get current model selections
  const chatModel = useGetChatModel();
  const translationModel = useGetTranslationModel();
  
  // Get setter functions
  const setChatModel = useSetChatModel();
  const setTranslationModel = useSetTranslationModel();
  
  // Fetch available models
  const { data: chatModels, isSuccess } = useChatModels();

  useEffect(() => {
    // Only proceed if we have successfully loaded chat models
    if (!isSuccess || !chatModels?.data?.length) {
      return;
    }

    const defaultModel = chatModels.data[0].name;
    
    // Set chat model if not already set
    if (!chatModel) {
      setChatModel(defaultModel);
    }

    // Set translation model if not already set
    if (!translationModel) {
      setTranslationModel(defaultModel);
    }
  }, [
    isSuccess,
    chatModels,
    chatModel,
    translationModel,
    setChatModel,
    setTranslationModel,
  ]);
}
