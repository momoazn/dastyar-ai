import { describe, expect, it } from "bun:test";
import { normalizeFeatureToggles } from "./app-config";

describe("app-config feature toggles", () => {
  it("returns defaults when settings are missing", () => {
    const toggles = normalizeFeatureToggles({});

    expect(toggles.enable_chat).toBe(true);
    expect(toggles.enable_translation).toBe(true);
    expect(toggles.enable_summary).toBe(true);
    expect(toggles.enable_transcription).toBe(true);
    expect(toggles.enable_code_execution).toBe(true);
    expect(toggles.enable_image_generation).toBe(true);
  });

  it("applies boolean overrides from settings", () => {
    const toggles = normalizeFeatureToggles({
      enable_chat: false,
      enable_translation: true,
      enable_summary: false,
      enable_transcription: true,
      enable_code_execution: false,
      enable_image_generation: true,
    });

    expect(toggles.enable_chat).toBe(false);
    expect(toggles.enable_translation).toBe(true);
    expect(toggles.enable_summary).toBe(false);
    expect(toggles.enable_transcription).toBe(true);
    expect(toggles.enable_code_execution).toBe(false);
    expect(toggles.enable_image_generation).toBe(true);
  });

  it("ignores invalid value types and falls back to defaults", () => {
    const toggles = normalizeFeatureToggles({
      enable_chat: "false",
      enable_summary: 0,
      enable_code_execution: null,
    });

    expect(toggles.enable_chat).toBe(true);
    expect(toggles.enable_summary).toBe(true);
    expect(toggles.enable_code_execution).toBe(true);
  });
});
