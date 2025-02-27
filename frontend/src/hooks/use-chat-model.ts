import { useEffect } from "react";
import {
  useGetChatModel,
  useGetTranslationModel,
  useSetChatModel,
  useSetTranslationModel,
} from "../atoms";
import { useChatModels } from "../lib/api/chat";

export function useInitializeSelectedModels() {
  const chatModel = useGetChatModel();
  const setChatModel = useSetChatModel();
  const translationModel = useGetTranslationModel();
  const setTranslationModel = useSetTranslationModel();

  const { data: chatModels } = useChatModels();

  useEffect(() => {
    if (chatModels?.data && !Boolean(chatModel)) {
      setChatModel(chatModels.data[0].name);
    }

    if (chatModels?.data && !Boolean(translationModel)) {
      setTranslationModel(chatModels.data[0].name);
    }
  }, [
    chatModels,
    chatModel,
    setChatModel,
    translationModel,
    setTranslationModel,
  ]);
}
