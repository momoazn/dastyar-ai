import { describe, expect, it } from "bun:test";
import type { GenerationSettings } from "@/server/procedures/images";
import {
  buildSrc,
  formatSizeValue,
  getMergedSettings,
  parseSizeValue,
  parseSearchParams,
} from "./image-generation-utils";

describe("Image Generation Utils", () => {
  describe("parseSizeValue", () => {
    it("should parse square size", () => {
      expect(parseSizeValue("512")).toEqual({ width: 512, height: 512 });
      expect(parseSizeValue("1024")).toEqual({ width: 1024, height: 1024 });
    });

    it("should parse rectangular size", () => {
      expect(parseSizeValue("512x768")).toEqual({ width: 512, height: 768 });
      expect(parseSizeValue("1024x512")).toEqual({ width: 1024, height: 512 });
    });

    it("should handle different separators", () => {
      expect(parseSizeValue("1920x1080")).toEqual({ width: 1920, height: 1080 });
    });

    it("should handle string numbers", () => {
      expect(parseSizeValue("256")).toEqual({ width: 256, height: 256 });
    });
  });

  describe("formatSizeValue", () => {
    it("should format square size as single number", () => {
      expect(formatSizeValue(512, 512)).toBe("512");
      expect(formatSizeValue(1024, 1024)).toBe("1024");
    });

    it("should format rectangular size with x separator", () => {
      expect(formatSizeValue(512, 768)).toBe("512x768");
      expect(formatSizeValue(1920, 1080)).toBe("1920x1080");
    });

    it("should handle different aspect ratios", () => {
      expect(formatSizeValue(1024, 512)).toBe("1024x512");
      expect(formatSizeValue(768, 1024)).toBe("768x1024");
    });
  });

  describe("buildSrc", () => {
    it("should build URL with relative path and no token", () => {
      const url = "/api/images/123";
      const result = buildSrc(url, null);
      expect(result).toContain("/api/images/123");
    });

    it("should build URL with token", () => {
      const url = "/api/images/123";
      const token = "test-token";
      const result = buildSrc(url, token);
      expect(result).toContain("?token=test-token");
    });

    it("should handle absolute URLs", () => {
      const url = "http://example.com/image.png";
      const result = buildSrc(url, null);
      expect(result).toBe("http://example.com/image.png");
    });

    it("should add token to absolute URLs", () => {
      const url = "http://example.com/image.png";
      const token = "test-token";
      const result = buildSrc(url, token);
      expect(result).toBe("http://example.com/image.png?token=test-token");
    });

    it("should encode token parameter", () => {
      const url = "/api/images/123";
      const token = "token with spaces & special=chars";
      const result = buildSrc(url, token);
      expect(result).toContain("token=");
      expect(result).toContain("%20"); // Space encoded
      expect(result).toContain("%26"); // & encoded
    });

    it("should handle https URLs", () => {
      const url = "https://example.com/image.png";
      const result = buildSrc(url, null);
      expect(result).toBe("https://example.com/image.png");
    });
  });

  describe("getMergedSettings", () => {
    const defaults: GenerationSettings = {
      width: 512,
      height: 512,
      sampler: "Euler a",
      steps: 20,
      cfgScale: 7,
      negativePrompt: "",
    };

    it("should use defaults when raw is empty", () => {
      const result = getMergedSettings({}, defaults);
      expect(result).toEqual(defaults);
    });

    it("should override width", () => {
      const result = getMergedSettings({ width: 1024 }, defaults);
      expect(result.width).toBe(1024);
      expect(result.height).toBe(512); // Default preserved
    });

    it("should override height", () => {
      const result = getMergedSettings({ height: 768 }, defaults);
      expect(result.height).toBe(768);
      expect(result.width).toBe(512); // Default preserved
    });

    it("should override sampler", () => {
      const result = getMergedSettings({ sampler: "DPM++ 2M" }, defaults);
      expect(result.sampler).toBe("DPM++ 2M");
    });

    it("should override steps", () => {
      const result = getMergedSettings({ steps: 30 }, defaults);
      expect(result.steps).toBe(30);
    });

    it("should override cfgScale", () => {
      const result = getMergedSettings({ cfgScale: 10 }, defaults);
      expect(result.cfgScale).toBe(10);
    });

    it("should override negativePrompt", () => {
      const result = getMergedSettings(
        { negativePrompt: "ugly, blurry" },
        defaults
      );
      expect(result.negativePrompt).toBe("ugly, blurry");
    });

    it("should override multiple properties", () => {
      const raw = {
        width: 1024,
        height: 768,
        steps: 25,
        cfgScale: 8.5,
      };
      const result = getMergedSettings(raw, defaults);
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
      expect(result.steps).toBe(25);
      expect(result.cfgScale).toBe(8.5);
      expect(result.sampler).toBe("Euler a"); // Default preserved
    });

    it("should handle zero values", () => {
      const result = getMergedSettings({ steps: 0 }, defaults);
      expect(result.steps).toBe(0);
    });
  });

  describe("parseSearchParams", () => {
    it("should parse width from string", () => {
      const { settings } = parseSearchParams({ width: "1024" });
      expect(settings.width).toBe(1024);
    });

    it("should parse width from number", () => {
      const { settings } = parseSearchParams({ width: 1024 });
      expect(settings.width).toBe(1024);
    });

    it("should parse height from string", () => {
      const { settings } = parseSearchParams({ height: "768" });
      expect(settings.height).toBe(768);
    });

    it("should parse height from number", () => {
      const { settings } = parseSearchParams({ height: 768 });
      expect(settings.height).toBe(768);
    });

    it("should parse steps", () => {
      const { settings } = parseSearchParams({ steps: "30" });
      expect(settings.steps).toBe(30);
    });

    it("should parse cfgScale", () => {
      const { settings } = parseSearchParams({ cfgScale: "8.5" });
      expect(settings.cfgScale).toBe(8.5);
    });

    it("should parse sampler", () => {
      const { settings } = parseSearchParams({ sampler: "DPM++ 2M" });
      expect(settings.sampler).toBe("DPM++ 2M");
    });

    it("should parse negativePrompt", () => {
      const { settings } = parseSearchParams({
        negativePrompt: "ugly, blurry",
      });
      expect(settings.negativePrompt).toBe("ugly, blurry");
    });

    it("should parse initialPrompt", () => {
      const { initialPrompt } = parseSearchParams({
        initialPrompt: "a beautiful landscape",
      });
      expect(initialPrompt).toBe("a beautiful landscape");
    });

    it("should ignore invalid numbers", () => {
      const { settings } = parseSearchParams({ width: "not-a-number" });
      expect(settings.width).toBeUndefined();
    });

    it("should handle empty search params", () => {
      const { settings, initialPrompt } = parseSearchParams({});
      expect(settings).toEqual({});
      expect(initialPrompt).toBeNull();
    });

    it("should parse multiple parameters", () => {
      const { settings, initialPrompt } = parseSearchParams({
        width: "1024",
        height: "768",
        steps: "25",
        cfgScale: "7.5",
        sampler: "Euler a",
        negativePrompt: "ugly",
        initialPrompt: "test prompt",
      });

      expect(settings).toEqual({
        width: 1024,
        height: 768,
        steps: 25,
        cfgScale: 7.5,
        sampler: "Euler a",
        negativePrompt: "ugly",
      });
      expect(initialPrompt).toBe("test prompt");
    });

    it("should handle mixed valid and invalid parameters", () => {
      const { settings } = parseSearchParams({
        width: "1024",
        height: "invalid",
        steps: "30",
      });

      expect(settings.width).toBe(1024);
      expect(settings.height).toBeUndefined();
      expect(settings.steps).toBe(30);
    });

    it("should return null for missing initialPrompt", () => {
      const { initialPrompt } = parseSearchParams({ width: "512" });
      expect(initialPrompt).toBeNull();
    });
  });
});
