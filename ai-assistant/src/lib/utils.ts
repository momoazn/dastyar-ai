import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cache for text direction detection to avoid repeated calculations
const textDirectionCache = new Map<string, "rtl" | "ltr">();
const maxCacheSize = 1000;

export const detectTextDirection = (text: string): "rtl" | "ltr" => {
  // Check cache first
  if (textDirectionCache.has(text)) {
    return textDirectionCache.get(text)!;
  }

  const rtlRegex =
    /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  const direction = rtlRegex.test(text) ? "rtl" : "ltr";

  // Cache the result (with size limit)
  if (textDirectionCache.size >= maxCacheSize) {
    // Remove oldest entry
    const firstKey = textDirectionCache.keys().next().value;
    if (firstKey) {
      textDirectionCache.delete(firstKey);
    }
  }
  textDirectionCache.set(text, direction);

  return direction;
};
