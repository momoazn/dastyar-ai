import { describe, expect, it } from "bun:test";
import { splitTextIntoChunks } from "./rag";

describe("splitTextIntoChunks", () => {
  it("bounds chunks when a paragraph has no sentence punctuation", () => {
    // A long Persian paragraph without "." or "؟" is one giant "sentence".
    const text = "الفب".repeat(2500); // 5000 chars, no punctuation
    const chunks = splitTextIntoChunks(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeLessThanOrEqual(1400 + 200 + 2);
    }
    // No dropped text at the boundaries.
    expect(chunks[0].content.startsWith("الفب")).toBe(true);
    expect(chunks.at(-1)?.content.endsWith("الفب")).toBe(true);
  });

  it("keeps sequential chunk indexes", () => {
    const text = "الفب".repeat(2500);
    const chunks = splitTextIntoChunks(text);
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
  });

  it("keeps sentence-based chunking for normal text", () => {
    const text = `${"کوتاه. ".repeat(100)}\n\n${"بلندتر است. ".repeat(100)}`;
    const chunks = splitTextIntoChunks(text);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toContain("کوتاه");
    expect(chunks.at(-1)?.content).toContain("بلندتر است");
  });
});
