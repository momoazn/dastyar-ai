import { atom, useAtomValue, useSetAtom } from "jotai";

export const CHAT_MODEL_LS_KEY = "SELECTED_CHAT_MODEL";
const savedChatModel = localStorage.getItem(CHAT_MODEL_LS_KEY);

export const chatModelAtom = atom(savedChatModel ?? "");

export const useGetChatModel = () => {
  return useAtomValue(chatModelAtom);
};

export const useSetChatModel = () => {
  const setSelectedChatModel = useSetAtom(chatModelAtom);
  return (model: string) => {
    localStorage.setItem(CHAT_MODEL_LS_KEY, model);
    setSelectedChatModel(model);
  };
};

export const useChatModel = () => {
  return [useGetChatModel(), useSetChatModel()] as const;
};

export const TRANSLATION_MODEL_LS_KEY = "SELECTED_TRANSLATION_MODEL";
const savedTranslationModel = localStorage.getItem(TRANSLATION_MODEL_LS_KEY);

export const translationModelAtom = atom(savedTranslationModel ?? "");

export const useGetTranslationModel = () => {
  return useAtomValue(translationModelAtom);
};

export const useSetTranslationModel = () => {
  const setSelectedTranslationModel = useSetAtom(translationModelAtom);
  return (model: string) => {
    localStorage.setItem(TRANSLATION_MODEL_LS_KEY, model);
    setSelectedTranslationModel(model);
  };
};

export const useTranslationModel = () => {
  return [useGetTranslationModel(), useSetTranslationModel()] as const;
};
