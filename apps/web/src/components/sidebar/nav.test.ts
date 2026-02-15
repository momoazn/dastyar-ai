import { describe, expect, it } from "bun:test";
import { getEnabledNavItems, navMain } from "./nav";

describe("sidebar nav feature filtering", () => {
  it("returns all nav items when no toggles are provided", () => {
    const items = getEnabledNavItems(navMain);
    expect(items.length).toBe(navMain.length);
  });

  it("filters out disabled features", () => {
    const items = getEnabledNavItems(navMain, {
      enable_chat: false,
      enable_code_execution: false,
      enable_image_generation: true,
      enable_translation: true,
      enable_summary: true,
      enable_transcription: true,
    });

    expect(items.some((item) => item.url === "/chat/")).toBe(false);
    expect(items.some((item) => item.url === "/code/")).toBe(false);
    expect(items.some((item) => item.url === "/image")).toBe(true);
  });
});
