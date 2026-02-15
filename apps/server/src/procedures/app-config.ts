import { getAllSettings, FEATURE_TOGGLE_DEFAULTS } from "@/repositories/system-settings";
import { publicProcedure } from "./base";

export type FeatureToggleMap = {
  -readonly [K in keyof typeof FEATURE_TOGGLE_DEFAULTS]: boolean;
};

export function normalizeFeatureToggles(
  settingsMap: Record<string, unknown>
): FeatureToggleMap {
  const toggles = {} as FeatureToggleMap;

  for (const [key, defaultValue] of Object.entries(FEATURE_TOGGLE_DEFAULTS)) {
    const value = settingsMap[key];
    toggles[key as keyof FeatureToggleMap] =
      typeof value === "boolean" ? value : defaultValue;
  }

  return toggles;
}

export const appConfigProcedures = {
  getFeatureToggles: publicProcedure.handler(async () => {
    const settings = await getAllSettings();
    const settingsMap = Object.fromEntries(
      settings.map((setting) => [setting.key, setting.value])
    );

    return normalizeFeatureToggles(settingsMap);
  }),
};
