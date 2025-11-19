import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { cn, debounce, detectTextDirection, throttle } from "./utils";

describe("Utils", () => {
  describe("cn (classname utility)", () => {
    it("should merge class names", () => {
      expect(cn("class1", "class2")).toBe("class1 class2");
    });

    it("should handle conditional classes", () => {
      expect(cn("class1", false, "class3")).toBe("class1 class3");
    });

    it("should merge Tailwind classes correctly", () => {
      // twMerge should handle conflicting Tailwind classes
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("should handle arrays of classes", () => {
      expect(cn(["class1", "class2"])).toBe("class1 class2");
    });

    it("should handle objects of classes", () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe(
        "class1 class3"
      );
    });

    it("should handle undefined and null", () => {
      expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
    });

    it("should handle empty input", () => {
      expect(cn()).toBe("");
    });
  });

  describe("detectTextDirection", () => {
    it("should detect Persian text as RTL", () => {
      expect(detectTextDirection("سلام")).toBe("rtl");
      expect(detectTextDirection("مرحبا")).toBe("rtl");
    });

    it("should detect Arabic text as RTL", () => {
      expect(detectTextDirection("مرحبا")).toBe("rtl");
      expect(detectTextDirection("أهلا")).toBe("rtl");
    });

    it("should detect English text as LTR", () => {
      expect(detectTextDirection("Hello")).toBe("ltr");
      expect(detectTextDirection("World")).toBe("ltr");
    });

    it("should detect numbers as LTR", () => {
      expect(detectTextDirection("123")).toBe("ltr");
      expect(detectTextDirection("456 test")).toBe("ltr");
    });

    it("should use first word for direction detection", () => {
      // First word is Persian, so RTL
      expect(detectTextDirection("سلام world")).toBe("rtl");
      // First word is English, so LTR
      expect(detectTextDirection("Hello سلام")).toBe("ltr");
    });

    it("should handle empty string", () => {
      expect(detectTextDirection("")).toBe("ltr");
    });

    it("should handle whitespace-only string", () => {
      expect(detectTextDirection("   ")).toBe("ltr");
    });

    it("should trim whitespace before detection", () => {
      expect(detectTextDirection("   سلام   ")).toBe("rtl");
      expect(detectTextDirection("   Hello   ")).toBe("ltr");
    });

    it("should handle mixed content correctly", () => {
      // First word determines direction
      expect(detectTextDirection("سلام 123 Hello")).toBe("rtl");
      expect(detectTextDirection("Hello 123 سلام")).toBe("ltr");
    });

    it("should cache results for performance", () => {
      const text = "سلام دنیا";
      // First call
      const result1 = detectTextDirection(text);
      // Second call should use cache
      const result2 = detectTextDirection(text);
      expect(result1).toBe(result2);
      expect(result1).toBe("rtl");
    });

    it("should handle Hebrew text as RTL", () => {
      expect(detectTextDirection("שלום")).toBe("rtl");
    });

    it("should handle special characters", () => {
      expect(detectTextDirection("@#$%")).toBe("ltr");
      // Arabic punctuation (؟،) is detected as RTL by the regex
      expect(detectTextDirection("!؟،")).toBe("rtl");
    });
  });

  describe("debounce", () => {
    beforeEach(() => {
      // Use fake timers for testing
    });

    afterEach(() => {
      // Clean up
    });

    it("should delay function execution", async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount += 1;
      }, 100);

      debouncedFn();
      expect(callCount).toBe(0); // Not called yet

      // Wait for debounce delay
      await Bun.sleep(150);
      expect(callCount).toBe(1); // Called after delay
    });

    it("should cancel previous calls", async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount += 1;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      await Bun.sleep(150);
      expect(callCount).toBe(1); // Only called once
    });

    it("should pass arguments correctly", async () => {
      let lastArg: string | undefined;
      const debouncedFn = debounce((arg: string) => {
        lastArg = arg;
      }, 50);

      debouncedFn("test");
      await Bun.sleep(100);
      expect(lastArg).toBe("test");
    });

    it("should handle multiple arguments", async () => {
      let sum = 0;
      const debouncedFn = debounce((a: number, b: number) => {
        sum = a + b;
      }, 50);

      debouncedFn(5, 10);
      await Bun.sleep(100);
      expect(sum).toBe(15);
    });
  });

  describe("throttle", () => {
    it("should execute immediately on first call", () => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount += 1;
      }, 100);

      throttledFn();
      expect(callCount).toBe(1); // Called immediately
    });

    it("should ignore calls within throttle period", async () => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount += 1;
      }, 100);

      throttledFn(); // Called
      throttledFn(); // Ignored
      throttledFn(); // Ignored

      expect(callCount).toBe(1);

      // Wait for throttle period to expire
      await Bun.sleep(150);

      throttledFn(); // Should be called now
      expect(callCount).toBe(2);
    });

    it("should pass arguments correctly", () => {
      let lastArg: string | undefined;
      const throttledFn = throttle((arg: string) => {
        lastArg = arg;
      }, 100);

      throttledFn("test");
      expect(lastArg).toBe("test");
    });

    it("should handle multiple arguments", () => {
      let result = 0;
      const throttledFn = throttle((a: number, b: number) => {
        result = a * b;
      }, 100);

      throttledFn(5, 10);
      expect(result).toBe(50);
    });

    it("should allow execution after throttle period", async () => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount += 1;
      }, 50);

      throttledFn(); // Call 1
      expect(callCount).toBe(1);

      await Bun.sleep(60); // Wait for throttle period

      throttledFn(); // Call 2
      expect(callCount).toBe(2);
    });
  });
});
