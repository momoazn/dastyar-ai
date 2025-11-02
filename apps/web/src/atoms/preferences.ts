import { atom } from "jotai";
import type { SelectUserPreferences } from "@/server/database/schema";

export const userPreferencesAtom = atom<SelectUserPreferences | null>(null);

export const isPreferencesLoadedAtom = atom<boolean>(false);
