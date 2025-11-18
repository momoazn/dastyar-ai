import { describe, expect, it } from "bun:test";
import type { UIMessage } from "ai";
import { extractTextFromParts } from "./text-extractor";

describe("Text Extractor", () => {
  describe("extractTextFromParts", () => {
    it("should extract text from single text part", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Hello world" }],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Hello world");
      expect(result.reasoning).toBeNull();
    });

    it("should extract text from multiple text parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "First part" },
          { type: "text", text: "Second part" },
          { type: "text", text: "Third part" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("First part\nSecond part\nThird part");
      expect(result.reasoning).toBeNull();
    });

    it("should extract reasoning from reasoning parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "I am thinking..." },
          { type: "text", text: "Here is my answer" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Here is my answer");
      expect(result.reasoning).toBe("I am thinking...");
    });

    it("should extract multiple reasoning parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "First thought" },
          { type: "reasoning", text: "Second thought" },
          { type: "text", text: "Final answer" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Final answer");
      expect(result.reasoning).toBe("First thought\nSecond thought");
    });

    it("should handle empty parts array", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("");
      expect(result.reasoning).toBeNull();
    });

    it("should handle message with only reasoning parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Thinking step 1" },
          { type: "reasoning", text: "Thinking step 2" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("");
      expect(result.reasoning).toBe("Thinking step 1\nThinking step 2");
    });

    it("should handle message with only text parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "Part 1" },
          { type: "text", text: "Part 2" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Part 1\nPart 2");
      expect(result.reasoning).toBeNull();
    });

    it("should trim whitespace from content", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "  Text with spaces  " },
          { type: "text", text: "\nText with newlines\n" },
        ],
      };

      const result = extractTextFromParts(message);
      // Final result is trimmed
      expect(result.content).toBe(
        "Text with spaces  \n\nText with newlines"
      );
    });

    it("should return null for empty reasoning", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Answer" },
          { type: "reasoning", text: "" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Answer");
      expect(result.reasoning).toBeNull();
    });

    it("should handle mixed empty and non-empty parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "" },
          { type: "text", text: "Non-empty" },
          { type: "text", text: "" },
        ],
      };

      const result = extractTextFromParts(message);
      // Final result is trimmed, so leading/trailing newlines are removed
      expect(result.content).toBe("Non-empty");
    });

    it("should handle complex interleaved parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Thought 1" },
          { type: "text", text: "Response 1" },
          { type: "reasoning", text: "Thought 2" },
          { type: "text", text: "Response 2" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Response 1\nResponse 2");
      expect(result.reasoning).toBe("Thought 1\nThought 2");
    });

    it("should handle whitespace-only text parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "   " },
          { type: "text", text: "\t\n" },
        ],
      };

      const result = extractTextFromParts(message);
      // After joining with \n and trimming, whitespace-only content becomes empty
      expect(result.content).toBe("");
    });

    it("should handle whitespace-only reasoning parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "reasoning", text: "   " },
          { type: "text", text: "Answer" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("Answer");
      // Whitespace-only reasoning after trim becomes empty, so null
      expect(result.reasoning).toBeNull();
    });

    it("should handle Unicode and special characters", () => {
      const message: UIMessage = {
        id: "1",
        role: "user",
        parts: [
          { type: "text", text: "سلام دنیا" }, // Persian
          { type: "text", text: "Hello 世界" }, // Chinese
          { type: "text", text: "🎉 Emoji 🚀" },
        ],
      };

      const result = extractTextFromParts(message);
      expect(result.content).toBe("سلام دنیا\nHello 世界\n🎉 Emoji 🚀");
      expect(result.reasoning).toBeNull();
    });
  });
});
