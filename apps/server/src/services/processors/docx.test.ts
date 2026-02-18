import { describe, expect, it } from "bun:test";
import { extractTextFromDocx } from "./docx";

describe("DOCX Processor", () => {
  it("returns empty string for non-existent file", async () => {
    const result = await extractTextFromDocx("/tmp/does-not-exist.docx");
    expect(result).toBe("");
  });
});
