import { type ClassValue, clsx } from "clsx";
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

// Debounce utility for expensive operations
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for limiting function calls
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
