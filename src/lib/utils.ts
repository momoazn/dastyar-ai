import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MessagesStatusOptions } from "./pocketbase-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ===== PERFORMANCE OPTIMIZATION UTILITIES =====

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
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for limiting function calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoization utility for pure functions
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  cacheSize: number = 100,
): T {
  const cache = new Map();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);

    // Limit cache size
    if (cache.size >= cacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, result);
    return result;
  }) as T;
}

interface SSEPayload {
  status: MessagesStatusOptions;
  reasoning?: string;
  response?: string;
  fullContent?: string;
}

interface PostAndStreamSSEOptions {
  url: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
  onMessage: (payload: SSEPayload) => void;
  onError?: (err: unknown) => void;
  onComplete?: () => void;
}

export async function postAndStreamSSE({
  url,
  body,
  signal,
  onMessage,
  onError,
  onComplete,
}: PostAndStreamSSEOptions) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to connect. Status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const abortListener = () => {
      reader.cancel(); // cancel the stream
    };

    signal?.addEventListener("abort", abortListener);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);

        const dataLine = rawEvent
          .split("\n")
          .find((line) => line.startsWith("data:"));

        if (dataLine) {
          const jsonStr = dataLine.replace(/^data:\s*/, "");
          try {
            const payload: SSEPayload = JSON.parse(jsonStr);
            onMessage(payload);
          } catch (err) {
            console.error("Invalid SSE JSON:", jsonStr);
          }
        }
      }
    }

    signal?.removeEventListener("abort", abortListener);
  } catch (err) {
    if (signal?.aborted) {
      console.warn("SSE stream aborted");
    } else {
      console.error("SSE stream error:", err);
      onError?.(err);
    }
  }

  onComplete?.();
}
