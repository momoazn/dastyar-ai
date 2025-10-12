import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Persist token in localStorage
export const tokenAtom = atomWithStorage<string | null>("auth-token", null);

// Derived atom for authentication status
export const isAuthenticatedAtom = atom((get) => {
  const token = get(tokenAtom);
  return !!token;
});

// Logout function atom
export const logoutAtom = atom(null, (_, set) => {
  set(tokenAtom, null);
});
