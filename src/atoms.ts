import { atom, useAtomValue, useSetAtom } from "jotai";

const DEFAULT_CHAT_MODEL_STORAGE_KEY = "default_chat_model";
const DEFAULT_TRANSLATION_MODEL_STORAGE_KEY = "default_translation_model";

const defaultChatModelAtom = atom<string | null>(
  localStorage.getItem(DEFAULT_CHAT_MODEL_STORAGE_KEY) || null,
);
const defaultTranslationModelAtom = atom<string | null>(
  localStorage.getItem(DEFAULT_TRANSLATION_MODEL_STORAGE_KEY) || null,
);

export const useGetDefaultChatModel = () => {
  return useAtomValue(defaultChatModelAtom);
};

export const useSetDefaultChatModel = () => {
  const setDefaultChatModel = useSetAtom(defaultChatModelAtom);

  return (model: string) => {
    localStorage.setItem(DEFAULT_CHAT_MODEL_STORAGE_KEY, model);
    setDefaultChatModel(model);
  };
};

export const useGetDefaultTranslationModel = () => {
  return useAtomValue(defaultTranslationModelAtom);
};

export const useSetDefaultTranslationModel = () => {
  const setDefaultTranslationModel = useSetAtom(defaultTranslationModelAtom);

  return (model: string) => {
    localStorage.setItem(DEFAULT_TRANSLATION_MODEL_STORAGE_KEY, model);
    setDefaultTranslationModel(model);
  };
};
