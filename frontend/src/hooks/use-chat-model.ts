import { useEffect } from "react";
import { useGetSelectedChatModel, useSetSelectedChatModel } from "../atoms";
import { useChatModels } from "../lib/api/chat";

export function useInitializeChatModel() {
  const selectedChatModel = useGetSelectedChatModel();
  const setSelectedChatModel = useSetSelectedChatModel();
  const { data: chatModels } = useChatModels();

  useEffect(() => {
    if (chatModels?.data && !Boolean(selectedChatModel)) {
      setSelectedChatModel(chatModels.data[0].name);
    }
  }, [chatModels, selectedChatModel, setSelectedChatModel]);
}
