import { describe, expect, it } from "bun:test";
import {
  buildChatTitlePrompt,
  isDefaultChatTitle,
  pickSmallestTitleModel,
  sanitizeGeneratedTitle,
} from "./chat-title";

describe("chat title helpers", () => {
  it("selects the smallest enabled text model with known size", () => {
    const model = pickSmallestTitleModel([
      {
        id: 1,
        identifier: "qwen2.5:7b",
        provider: "ollama",
        size: "7b",
        isEnabled: true,
      },
      {
        id: 2,
        identifier: "all-minilm:embed",
        provider: "ollama",
        size: "300m",
        isEnabled: true,
      },
      {
        id: 3,
        identifier: "qwen2.5:1.5b",
        provider: "ollama",
        size: "1.5b",
        isEnabled: true,
      },
      {
        id: 4,
        identifier: "tiny-unknown",
        provider: "lmstudio",
        size: null,
        isEnabled: true,
      },
    ]);

    expect(model?.id).toBe(3);
  });

  it("falls back to unknown-size text models after known-size models", () => {
    const model = pickSmallestTitleModel([
      {
        id: 1,
        identifier: "unknown-local",
        provider: "lmstudio",
        size: null,
        isEnabled: true,
      },
      {
        id: 2,
        identifier: "disabled-small:270m",
        provider: "ollama",
        size: "270m",
        isEnabled: false,
      },
    ]);

    expect(model?.id).toBe(1);
  });

  it("cleans generated titles into short plain text", () => {
    expect(sanitizeGeneratedTitle('"بررسی خطای ورود به سامانه!"')).toBe(
      "بررسی خطای ورود به سامانه"
    );
    expect(sanitizeGeneratedTitle("")).toBeNull();
  });

  it("builds a compact Persian-first title prompt", () => {
    const prompt = buildChatTitlePrompt("چطور در React فرم بسازم؟");

    expect(prompt.system).toContain("short Persian title");
    expect(prompt.prompt).toContain("چطور در React فرم بسازم؟");
  });

  it("only replaces the default chat title", () => {
    expect(isDefaultChatTitle("گفتگوی جدید")).toBe(true);
    expect(isDefaultChatTitle("React فرم")).toBe(false);
  });
});
