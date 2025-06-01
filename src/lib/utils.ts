import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MessagesStatusOptions } from "./pocketbase-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const detectTextDirection = (text: string): "rtl" | "ltr" => {
  const rtlRegex =
    /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text) ? "rtl" : "ltr";
};

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

    onComplete?.();
  }
}
