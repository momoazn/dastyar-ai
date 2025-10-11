import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type User = {
  id: number;
  username: string;
  role: "admin" | "user";
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

// Persist token in localStorage
export const tokenAtom = atomWithStorage<string | null>("auth-token", null);

// Auth state atom
export const authAtom = atom<AuthState>({
  user: null,
  token: null,
  isLoading: true,
});

// Derived atoms
export const userAtom = atom(
  (get) => get(authAtom).user,
  (get, set, user: User | null) => {
    const current = get(authAtom);
    set(authAtom, { ...current, user });
  }
);

export const isAuthenticatedAtom = atom((get) => !!get(authAtom).user);

export const isLoadingAtom = atom(
  (get) => get(authAtom).isLoading,
  (get, set, isLoading: boolean) => {
    const current = get(authAtom);
    set(authAtom, { ...current, isLoading });
  }
);
