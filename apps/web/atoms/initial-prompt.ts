import { atom } from 'jotai';

interface InitialPrompt {
  prompt: string;
  isUsed: boolean;
  threadId: string;
}

export const initialPromptAtom = atom<InitialPrompt>({
  prompt: '',
  isUsed: false,
  threadId: '',
});
