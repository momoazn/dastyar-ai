import { describe, expect, it } from "bun:test";
import { normalizePersianText } from "./persian-normalize";

describe("Persian Text Normalization", () => {
  describe("normalizePersianText", () => {
    it("should normalize Arabic Yeh to Persian Yeh", () => {
      // Arabic Yeh (ي U+064A) → Persian Yeh (ی U+06CC)
      expect(normalizePersianText("علي")).toBe("علی");
      // Arabic Alef Maksura (ى U+0649) → Persian Yeh
      expect(normalizePersianText("على")).toBe("علی");
    });

    it("should normalize Arabic Kaf to Persian Kaf", () => {
      // Arabic Kaf (ك U+0643) → Persian Kaf (ک U+06A9)
      expect(normalizePersianText("كتاب")).toBe("کتاب");
    });

    it("should convert Arabic digits to Persian digits", () => {
      expect(normalizePersianText("٠١٢٣٤٥٦٧٨٩")).toBe("۰۱۲۳۴۵۶۷۸۹");
      expect(normalizePersianText("سال ١٤٠٢")).toBe("سال ۱۴۰۲");
    });

    it("should convert punctuation to Persian equivalents", () => {
      expect(normalizePersianText("سلام, دنیا")).toBe("سلام، دنیا");
      expect(normalizePersianText("چرا; نمی‌دانم")).toBe("چرا؛ نمی‌دانم");
      expect(normalizePersianText("چطور?")).toBe("چطور؟");
    });

    it("should remove tatweel (kashida)", () => {
      // Tatweel (ـ U+0640) used for elongation
      expect(normalizePersianText("سلــــام")).toBe("سلام");
      expect(normalizePersianText("کتـــــــاب")).toBe("کتاب");
    });

    it("should handle Waw with Hamza", () => {
      // Arabic Waw with Hamza (ؤ U+0624) → Waw (و)
      expect(normalizePersianText("سؤال")).toBe("سوال");
    });

    it("should handle Yeh with Hamza", () => {
      // Arabic Yeh with Hamza (ئ U+0626) → Persian Yeh (ی)
      expect(normalizePersianText("عائله")).toBe("عایله");
    });

    it("should apply Unicode NFC normalization", () => {
      // Test that combining characters are properly normalized
      const decomposed = "ک\u0301"; // K + combining acute accent
      const result = normalizePersianText(decomposed);
      expect(result.normalize("NFC")).toBe(result);
    });

    it("should handle empty string", () => {
      expect(normalizePersianText("")).toBe("");
    });

    it("should handle null and undefined gracefully", () => {
      // @ts-expect-error Testing edge case
      expect(normalizePersianText(null)).toBeNull();
      // @ts-expect-error Testing edge case
      expect(normalizePersianText(undefined)).toBeUndefined();
    });

    it("should handle text with no Persian or Arabic characters", () => {
      expect(normalizePersianText("Hello World")).toBe("Hello World");
      expect(normalizePersianText("12345")).toBe("12345");
    });

    it("should handle mixed Persian, Arabic, and English text", () => {
      const mixed = "علي (Ali) در سال ١٤٠٢, کتاب خواند?";
      const expected = "علی (Ali) در سال ۱۴۰۲، کتاب خواند؟";
      expect(normalizePersianText(mixed)).toBe(expected);
    });

    it("should handle text with multiple normalizations needed", () => {
      // Contains: Arabic Yeh, Arabic Kaf, Arabic digits, comma, tatweel
      const text = "كتاب علي در سال ١٤٠٢, خيلـــي خوب است";
      const expected = "کتاب علی در سال ۱۴۰۲، خیلی خوب است";
      expect(normalizePersianText(text)).toBe(expected);
    });

    it("should be idempotent", () => {
      const text = "كتاب علي در سال ١٤٠٢";
      const normalized = normalizePersianText(text);
      const normalizedAgain = normalizePersianText(normalized);
      expect(normalized).toBe(normalizedAgain);
    });

    it("should handle text with whitespace", () => {
      expect(normalizePersianText("  سلام  ")).toBe("  سلام  ");
      expect(normalizePersianText("سلام\nدنیا")).toBe("سلام\nدنیا");
      expect(normalizePersianText("سلام\tدنیا")).toBe("سلام\tدنیا");
    });

    it("should handle special characters and symbols", () => {
      expect(normalizePersianText("۱۰۰$ دلار")).toBe("۱۰۰$ دلار");
      expect(normalizePersianText("ایمیل: test@example.com")).toBe(
        "ایمیل: test@example.com"
      );
    });

    it("should preserve URLs and email addresses", () => {
      const text = "وبسایت: https://example.com, ایمیل: test@example.com";
      const result = normalizePersianText(text);
      expect(result).toContain("https://example.com");
      expect(result).toContain("test@example.com");
    });

    it("should handle Persian poetry with proper formatting", () => {
      const poetry = "دل می‌رود ز دستم، صاحب‌دلان خدا را\nدردا که راز پنهان، خواهد شد آشکارا";
      const result = normalizePersianText(poetry);
      expect(result).toContain("\n"); // Preserve line breaks
      expect(result).toContain("،"); // Persian comma
    });

    it("should handle all Arabic digits at once", () => {
      expect(normalizePersianText("٠٠٠")).toBe("۰۰۰");
      expect(normalizePersianText("٩٩٩")).toBe("۹۹۹");
    });

    it("should handle consecutive tatweel characters", () => {
      expect(normalizePersianText("ســـلـــام")).toBe("سلام");
    });

    it("should handle mixed number systems", () => {
      const text = "۱۲۳ و ١٢٣ و 123";
      const expected = "۱۲۳ و ۱۲۳ و 123";
      expect(normalizePersianText(text)).toBe(expected);
    });

    it("should normalize common Persian words correctly", () => {
      expect(normalizePersianText("كتابخانه")).toBe("کتابخانه");
      expect(normalizePersianText("دانشگاه")).toBe("دانشگاه");
      expect(normalizePersianText("رایانه")).toBe("رایانه");
    });

    it("should handle Persian text with diacritics", () => {
      // Persian diacritics should be preserved
      const text = "کِتاب"; // Kasreh
      const result = normalizePersianText(text);
      expect(result).toBeDefined();
      // After NFC normalization, diacritics should be in canonical form
      expect(result.normalize("NFC")).toBe(result);
    });
  });
});
