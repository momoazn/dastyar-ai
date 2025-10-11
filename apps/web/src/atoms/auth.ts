import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type User = {
  id: number;
  username: string;
  role: "admin" | "user";
};

// Persist token in localStorage
export const tokenAtom = atomWithStorage<string | null>("auth-token", null);

// User atom
export const userAtom = atom<User | null>(null);

// Loading state atom
export const isLoadingAtom = atom<boolean>(false);

// Derived atoms
export const isAuthenticatedAtom = atom((get) => !!get(userAtom));
