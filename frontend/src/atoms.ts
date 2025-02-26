import { atom, useAtomValue, useSetAtom } from "jotai";

export const SELECTED_MODEL_LS_KEY = "SELECTED_CHAT_MODEL";
const savedSelectedModel = localStorage.getItem(SELECTED_MODEL_LS_KEY);

export const selectedChatModelAtom = atom<string>(savedSelectedModel ?? "");

export const useGetSelectedChatModel = () => {
  return useAtomValue(selectedChatModelAtom);
};

export const useSetSelectedChatModel = () => {
  const setSelectedChatModel = useSetAtom(selectedChatModelAtom);
  return (model: string) => {
    localStorage.setItem(SELECTED_MODEL_LS_KEY, model);
    setSelectedChatModel(model);
  };
};
