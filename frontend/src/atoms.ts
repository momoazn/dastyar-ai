import { atom, useAtomValue, useSetAtom } from "jotai";

// Constants
const STORAGE_KEYS = {
  CHAT_MODEL: "SELECTED_CHAT_MODEL",
  TRANSLATION_MODEL: "SELECTED_TRANSLATION_MODEL",
};

// Create a reusable function for model atoms
const createModelAtom = (storageKey: string) => {
  const modelAtom = atom(localStorage.getItem(storageKey) || "");

  const useGetModel = () => useAtomValue(modelAtom);

  const useSetModel = () => {
    const setModel = useSetAtom(modelAtom);
    return (model: string) => {
      localStorage.setItem(storageKey, model);
      setModel(model);
    };
  };

  const useModel = () => [useGetModel(), useSetModel()] as const;

  return { modelAtom, useGetModel, useSetModel, useModel };
};

// Chat model atoms and hooks
const {
  modelAtom: chatModelAtom,
  useGetModel: useGetChatModel,
  useSetModel: useSetChatModel,
  useModel: useChatModel,
} = createModelAtom(STORAGE_KEYS.CHAT_MODEL);

// Translation model atoms and hooks
const {
  modelAtom: translationModelAtom,
  useGetModel: useGetTranslationModel,
  useSetModel: useSetTranslationModel,
  useModel: useTranslationModel,
} = createModelAtom(STORAGE_KEYS.TRANSLATION_MODEL);

export {
  STORAGE_KEYS,
  chatModelAtom,
  useGetChatModel,
  useSetChatModel,
  useChatModel,
  translationModelAtom,
  useGetTranslationModel,
  useSetTranslationModel,
  useTranslationModel,
};
