/**
 * Persian Text Normalization
 * Replicates the functionality of Python's hazm library for Persian text processing
 */

/**
 * Normalizes Persian text by converting Arabic characters, mapping punctuation,
 * removing tatweel, and applying Unicode normalization
 */
export function normalizePersianText(text: string): string {
  if (!text) {
    return text;
  }

  let normalized = text;

  // Convert Arabic characters to Persian equivalents
  normalized = convertArabicToPersian(normalized);

  // Map punctuation to Persian equivalents
  normalized = mapPersianPunctuation(normalized);

  // Remove tatweel (Arabic kashida/elongation character)
  normalized = removeTatweel(normalized);

  // Apply Unicode normalization (NFC)
  normalized = normalized.normalize("NFC");

  return normalized;
}

/**
 * Converts Arabic characters to their Persian equivalents
 * Based on hazm's char_standardization
 */
function convertArabicToPersian(text: string): string {
  const arabicToPersianMap: Record<string, string> = {
    // Arabic Yeh variants → Persian Yeh
    "\u064A": "\u06CC", // ي → ی
    "\u0649": "\u06CC", // ى → ی

    // Arabic Kaf → Persian Kaf
    "\u0643": "\u06A9", // ك → ک

    // Arabic digits → Persian digits
    "\u0660": "\u06F0", // ٠ → ۰
    "\u0661": "\u06F1", // ١ → ۱
    "\u0662": "\u06F2", // ٢ → ۲
    "\u0663": "\u06F3", // ٣ → ۳
    "\u0664": "\u06F4", // ٤ → ۴
    "\u0665": "\u06F5", // ٥ → ۵
    "\u0666": "\u06F6", // ٦ → ۶
    "\u0667": "\u06F7", // ٧ → ۷
    "\u0668": "\u06F8", // ٨ → ۸
    "\u0669": "\u06F9", // ٩ → ۹

    // Additional Arabic character variants
    "\u0624": "\u0648", // ؤ → و (Arabic Waw with Hamza → Waw)
    "\u0626": "\u06CC", // ئ → ی (Arabic Yeh with Hamza → Persian Yeh)
  };

  let normalized = text;

  for (const [arabic, persian] of Object.entries(arabicToPersianMap)) {
    normalized = normalized.replaceAll(arabic, persian);
  }

  return normalized;
}

/**
 * Maps punctuation to Persian equivalents
 */
function mapPersianPunctuation(text: string): string {
  const punctuationMap: Record<string, string> = {
    ",": "،", // Comma → Persian comma
    ";": "؛", // Semicolon → Arabic semicolon
    "?": "؟", // Question mark → Arabic question mark
  };

  let result = text;
  for (const [latin, persian] of Object.entries(punctuationMap)) {
    result = result.replaceAll(latin, persian);
  }

  return result;
}

/**
 * Removes tatweel (Arabic kashida/elongation character)
 * Tatweel (ـ, U+0640) is used for text justification but not meaningful
 */
function removeTatweel(text: string): string {
  return text.replaceAll("\u0640", "");
}

/**
 * Additional normalization: Half-width to full-width conversion for consistency
 */
