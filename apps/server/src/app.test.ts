import { afterEach, describe, expect, it } from "bun:test";
import { createApp } from "./app";

describe("server health route", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("reports whisper as available when the upstream health check succeeds", async () => {
    let requestedUrl = "";

    globalThis.fetch = ((input: Parameters<typeof fetch>[0]) => {
      requestedUrl = String(input);
      return Promise.resolve(
        new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }) as unknown as typeof fetch;

    const response = await createApp().request("/health");
    const payload = (await response.json()) as {
      status: string;
      whisper: { available: boolean; status: number };
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ok",
      whisper: {
        available: true,
        status: 200,
      },
    });
    expect(requestedUrl.endsWith("/health")).toBe(true);
  });

  it("reports whisper as unavailable when the upstream health check fails", async () => {
    globalThis.fetch = (() =>
      Promise.reject(
        new Error("connection refused")
      )) as unknown as typeof fetch;

    const response = await createApp().request("/health");
    const payload = (await response.json()) as {
      status: string;
      whisper: { available: boolean; status: number };
    };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      status: "ok",
      whisper: {
        available: false,
        status: 0,
      },
    });
  });
});
