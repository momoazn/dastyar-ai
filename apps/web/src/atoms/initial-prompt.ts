import { atom } from "jotai";

type InitialPrompt = {
  prompt: string;
  isUsed: boolean;
  threadId: string;
};

export const initialPromptAtom = atom<InitialPrompt>({
  prompt: "",
  isUsed: false,
  threadId: "",
});
