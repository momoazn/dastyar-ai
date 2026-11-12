import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { DEMO_TOKEN, IS_DEMO } from "@/demo/mode";

export const LS_TOKEN_KEY = "auth-token";

// Persist token in localStorage
export const tokenAtom = atomWithStorage<string | null>(
  LS_TOKEN_KEY,
  // Demo build starts signed in.
  IS_DEMO ? DEMO_TOKEN : null,
  undefined,
  {
    getOnInit: true,
  }
);

// Derived atom for authentication status
export const isAuthenticatedAtom = atom((get) => {
  const token = get(tokenAtom);
  return !!token;
});

// Logout function atom
export const logoutAtom = atom(null, (_, set) => {
  set(tokenAtom, null);
});
