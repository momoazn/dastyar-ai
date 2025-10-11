import { atom } from "jotai";

// Global model atom (for backward compatibility)
export const modelIdAtom = atom<number | null>(null);

// Feature-specific model atoms
export const chatModelIdAtom = atom<number | null>(null);
export const summarizeModelIdAtom = atom<number | null>(null);
export const translationModelIdAtom = atom<number | null>(null);
export const codeModelIdAtom = atom<number | null>(null);
