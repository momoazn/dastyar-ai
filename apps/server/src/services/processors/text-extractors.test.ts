import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { writeFile as writeWorkbookFile, utils as xlsxUtils } from "xlsx";
import {
  extractTextFromEml,
  extractTextFromHtmlFile,
  extractTextFromRtfFile,
  extractTextFromUtf8File,
  extractTextFromXlsx,
} from "./text-extractors";

const TEST_DIR = join(import.meta.dir, "__text_extract_test_files__");

describe("Text Extractors", () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { force: true, recursive: true });
  });

  it("extracts plain text from UTF-8 files", async () => {
    const filePath = join(TEST_DIR, "note.txt");
    await writeFile(filePath, "hello world\nfrom text file", "utf8");

    const result = await extractTextFromUtf8File(filePath);
    expect(result).toContain("hello world");
    expect(result).toContain("from text file");
  });

  it("extracts readable text from HTML files", async () => {
    const filePath = join(TEST_DIR, "page.html");
    await writeFile(
      filePath,
      "<html><body><h1>Title</h1><p>Hello <b>world</b></p></body></html>",
      "utf8"
    );

    const result = await extractTextFromHtmlFile(filePath);
    expect(result).toContain("TITLE");
    expect(result).toContain("Hello world");
  });

  it("extracts text from EML files", async () => {
    const filePath = join(TEST_DIR, "mail.eml");
    await writeFile(
      filePath,
      [
        "From: sender@example.com",
        "To: receiver@example.com",
        "Subject: Test Email",
        "Content-Type: text/plain; charset=utf-8",
        "",
        "Hello from email body.",
      ].join("\n"),
      "utf8"
    );

    const result = await extractTextFromEml(filePath);
    expect(result).toContain("Hello from email body.");
  });

  it("extracts text from RTF files", async () => {
    const filePath = join(TEST_DIR, "doc.rtf");
    const rtf =
      "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}\\f0\\fs24 Hello\\par World}";
    await writeFile(filePath, rtf, "utf8");

    const result = await extractTextFromRtfFile(filePath);
    expect(result).toContain("Hello");
    expect(result).toContain("World");
  });

  it("extracts tabular text from XLSX files", async () => {
    const filePath = join(TEST_DIR, "sheet.xlsx");
    const workbook = xlsxUtils.book_new();
    const sheet = xlsxUtils.aoa_to_sheet([
      ["name", "score"],
      ["ali", 10],
    ]);
    xlsxUtils.book_append_sheet(workbook, sheet, "Scores");
    writeWorkbookFile(workbook, filePath);

    const result = await extractTextFromXlsx(filePath);
    expect(result).toContain("Scores");
    expect(result).toContain("name\tscore");
    expect(result).toContain("ali\t10");
  });
});
