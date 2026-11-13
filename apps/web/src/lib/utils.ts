import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and tailwind-merge
 * Handles conditional classes and resolves Tailwind conflicts
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn("px-2", { "bg-red": isActive }, "py-1")
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cache for text direction detection to avoid repeated calculations
const textDirectionCache = new Map<string, "rtl" | "ltr">();
const maxCacheSize = 1000;
const TOP_LEVEL_RTL_REGEX =
  /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const HAS_LETTER_OR_RTL =
  /[\p{L}\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/u;
const WORD_SPLIT_REGEX = /\s+/;

/**
 * Detects text direction (RTL or LTR) based on the first word
 * Uses caching to improve performance for repeated calls
 *
 * @param text - Text to analyze
 * @returns "rtl" for right-to-left languages (Persian, Arabic, Hebrew) or "ltr" for left-to-right
 *
 * @example
 * ```ts
 * detectTextDirection("سلام") // "rtl"
 * detectTextDirection("Hello") // "ltr"
 * ```
 */
export const detectTextDirection = (text: string): "rtl" | "ltr" => {
  // Check cache first
  if (textDirectionCache.has(text)) {
    const cached = textDirectionCache.get(text);
    if (cached) {
      return cached;
    }
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return "ltr";
  }

  const words = trimmed.split(WORD_SPLIT_REGEX);
  const meaningfulWord =
    words.find((w) => HAS_LETTER_OR_RTL.test(w)) ?? words[0];

  const direction = TOP_LEVEL_RTL_REGEX.test(meaningfulWord) ? "rtl" : "ltr";

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

/**
 * Debounce utility for expensive operations
 * Delays function execution until after a specified delay period
 *
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   searchAPI(query);
 * }, 300);
 * ```
 */
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

/**
 * Throttle utility for limiting function calls
 * Ensures function is called at most once per time period
 *
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```ts
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 * ```
 */
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

const HF_PREFIX_RE = /^hf\.co\/[^/]+\//;
const LATEST_TAG_RE = /:latest$/;

/**
 * Shortens a model identifier for display.
 * "hf.co/user/model-GGUF:latest" becomes "model-GGUF". Use the full
 * identifier in a `title` attribute so users can still see it.
 */
export function formatModelName(identifier: string): string {
  return identifier.replace(HF_PREFIX_RE, "").replace(LATEST_TAG_RE, "");
}

const WHITESPACE_RE = /\s+/g;

/** Short title from the first words of a message, cut at a word boundary. */
export function makeTitle(text: string, maxLength = 40): string {
  const flat = text.replace(WHITESPACE_RE, " ").trim();
  if (flat.length <= maxLength) {
    return flat;
  }
  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}
