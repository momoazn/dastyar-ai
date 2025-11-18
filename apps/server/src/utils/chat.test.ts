import { describe, expect, it } from "bun:test";
import type { MessageWithModel } from "@/repositories/threads";
import {
  convertDbMessagesToUiMessages,
  getModelSizeCategory,
  type MyUIMessage,
} from "./chat";

describe("Chat Utilities", () => {
  describe("convertDbMessagesToUiMessages", () => {
    it("should convert database messages to UI messages", () => {
      // @ts-expect-error - Test data doesn't perfectly match DB types
      const dbMessages: MessageWithModel[] = [
        {
          id: 1,
          threadId: 10,
          modelId: 5,
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          createdAt: new Date(),
          model: {
            id: 5,
            identifier: "llama3",
            provider: "ollama",
            creator: null,
            family: null,
            size: null,
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 2,
          threadId: 10,
          modelId: 5,
          role: "assistant",
          parts: [{ type: "text", text: "Hi there!" }],
          createdAt: new Date(),
          model: {
            id: 5,
            identifier: "llama3",
            provider: "ollama",
            creator: null,
            family: null,
            size: null,
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const uiMessages = convertDbMessagesToUiMessages(dbMessages);

      expect(uiMessages).toHaveLength(2);
      expect(uiMessages[0]!.id).toBe("1");
      expect(uiMessages[0]!.role).toBe("user");
      expect(uiMessages[0]!.parts).toEqual([{ type: "text", text: "Hello" }]);
      expect(uiMessages[0]!.metadata.modelId).toBe(5);
      expect(uiMessages[0]!.metadata.threadId).toBe(10);
      expect(uiMessages[0]!.metadata.modelName).toBe("llama3");

      expect(uiMessages[1]!.id).toBe("2");
      expect(uiMessages[1]!.role).toBe("assistant");
      expect(uiMessages[1]!.parts).toEqual([{ type: "text", text: "Hi there!" }]);
    });

    it("should handle messages without model", () => {
      // @ts-expect-error - Testing null model case
      const dbMessages: MessageWithModel[] = [
        {
          id: 1,
          threadId: 10,
          modelId: 5,
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          createdAt: new Date(),
          model: undefined,
        },
      ];

      const uiMessages = convertDbMessagesToUiMessages(dbMessages);

      expect(uiMessages).toHaveLength(1);
      expect(uiMessages[0]!.metadata.modelName).toBeUndefined();
    });

    it("should handle empty message array", () => {
      const uiMessages = convertDbMessagesToUiMessages([]);
      expect(uiMessages).toEqual([]);
    });

    it("should handle messages with multiple parts", () => {
      // @ts-expect-error - Testing null model case
      const dbMessages: MessageWithModel[] = [
        {
          id: 1,
          threadId: 10,
          modelId: 5,
          role: "assistant",
          parts: [
            { type: "text", text: "First part" },
            { type: "text", text: "Second part" },
          ],
          createdAt: new Date(),
          model: undefined,
        },
      ];

      const uiMessages = convertDbMessagesToUiMessages(dbMessages);

      expect(uiMessages[0]!.parts).toHaveLength(2);
      expect(uiMessages[0]!.parts[0]).toEqual({ type: "text", text: "First part" });
      expect(uiMessages[0]!.parts[1]).toEqual({
        type: "text",
        text: "Second part",
      });
    });
  });

  describe("getModelSizeCategory", () => {
    describe("minimal category (<=3B)", () => {
      it("should categorize small models correctly", () => {
        expect(getModelSizeCategory("1.7b")).toBe("minimal");
        expect(getModelSizeCategory("2.5b")).toBe("minimal");
        expect(getModelSizeCategory("3b")).toBe("minimal");
      });

      it("should handle million-scale models", () => {
        expect(getModelSizeCategory("500m")).toBe("minimal");
        expect(getModelSizeCategory("1500m")).toBe("minimal");
        expect(getModelSizeCategory("3000m")).toBe("minimal");
      });
    });

    describe("compact category (<=8B)", () => {
      it("should categorize mid-size models correctly", () => {
        expect(getModelSizeCategory("5b")).toBe("compact");
        expect(getModelSizeCategory("7b")).toBe("compact");
        expect(getModelSizeCategory("8b")).toBe("compact");
      });

      it("should handle models just above minimal threshold", () => {
        expect(getModelSizeCategory("3.1b")).toBe("compact");
        expect(getModelSizeCategory("4.5b")).toBe("compact");
      });
    });

    describe("balanced category (<=14B)", () => {
      it("should categorize balanced models correctly", () => {
        expect(getModelSizeCategory("10b")).toBe("balanced");
        expect(getModelSizeCategory("13b")).toBe("balanced");
        expect(getModelSizeCategory("14b")).toBe("balanced");
      });

      it("should handle models just above compact threshold", () => {
        expect(getModelSizeCategory("8.1b")).toBe("balanced");
        expect(getModelSizeCategory("12.5b")).toBe("balanced");
      });
    });

    describe("large category (<=34B)", () => {
      it("should categorize large models correctly", () => {
        expect(getModelSizeCategory("20b")).toBe("large");
        expect(getModelSizeCategory("30b")).toBe("large");
        expect(getModelSizeCategory("34b")).toBe("large");
      });

      it("should handle models just above balanced threshold", () => {
        expect(getModelSizeCategory("14.1b")).toBe("large");
        expect(getModelSizeCategory("25.5b")).toBe("large");
      });
    });

    describe("frontier category (>34B)", () => {
      it("should categorize frontier models correctly", () => {
        expect(getModelSizeCategory("70b")).toBe("frontier");
        expect(getModelSizeCategory("72b")).toBe("frontier");
        expect(getModelSizeCategory("175b")).toBe("frontier");
      });

      it("should handle models just above large threshold", () => {
        expect(getModelSizeCategory("34.1b")).toBe("frontier");
        expect(getModelSizeCategory("50b")).toBe("frontier");
      });
    });

    describe("edge cases", () => {
      it("should default to compact for null", () => {
        expect(getModelSizeCategory(null)).toBe("compact");
      });

      it("should default to compact for undefined", () => {
        expect(getModelSizeCategory(undefined)).toBe("compact");
      });

      it("should default to compact for empty string", () => {
        expect(getModelSizeCategory("")).toBe("compact");
      });

      it("should default to compact for unknown format", () => {
        expect(getModelSizeCategory("unknown")).toBe("compact");
        expect(getModelSizeCategory("large")).toBe("compact");
        expect(getModelSizeCategory("xyz")).toBe("compact");
      });

      it("should handle case insensitivity", () => {
        expect(getModelSizeCategory("7B")).toBe("compact");
        expect(getModelSizeCategory("70B")).toBe("frontier");
        expect(getModelSizeCategory("1.7B")).toBe("minimal");
      });

      it("should handle whitespace", () => {
        expect(getModelSizeCategory(" 7b ")).toBe("compact");
        expect(getModelSizeCategory("  13b  ")).toBe("balanced");
      });

      it("should handle decimal values", () => {
        expect(getModelSizeCategory("1.3b")).toBe("minimal");
        expect(getModelSizeCategory("7.5b")).toBe("compact");
        expect(getModelSizeCategory("13.5b")).toBe("balanced");
        expect(getModelSizeCategory("34.5b")).toBe("frontier");
      });

      it("should handle million unit", () => {
        expect(getModelSizeCategory("270m")).toBe("minimal");
        expect(getModelSizeCategory("270million")).toBe("minimal");
      });

      it("should handle billion unit variations", () => {
        expect(getModelSizeCategory("7billion")).toBe("compact");
        expect(getModelSizeCategory("7b")).toBe("compact");
      });

      it("should default to compact for unknown units", () => {
        expect(getModelSizeCategory("7k")).toBe("compact");
        expect(getModelSizeCategory("7t")).toBe("compact");
      });
    });
  });
});
