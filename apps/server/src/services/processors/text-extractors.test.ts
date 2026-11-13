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
    // Font table content must not leak into the extracted text.
    expect(result).not.toContain("Arial");
  });

  it("decodes RTF hex escapes with the document codepage (Persian)", async () => {
    const filePath = join(TEST_DIR, "farsi.rtf");
    // cp1256 bytes for "سلام" as Word writes Persian RTF.
    const rtf = "{\\rtf1\\ansicpg1256\\rtlch Salam: \\'d3\\'e1\\'c7\\'e3\\par}";
    await writeFile(filePath, rtf, "utf8");

    const result = await extractTextFromRtfFile(filePath);
    expect(result).toContain("سلام");
  });

  it("decodes RTF hex escapes with the document codepage (cp1252)", async () => {
    const filePath = join(TEST_DIR, "latin.rtf");
    const rtf = "{\\rtf1\\ansicpg1252 caf\\'e9 \\par}";
    await writeFile(filePath, rtf, "utf8");

    const result = await extractTextFromRtfFile(filePath);
    expect(result).toContain("café");
  });

  it("extracts readable text from HTML files that declare a non-UTF-8 charset", async () => {
    const filePath = join(TEST_DIR, "windows1256.html");
    // "سلام" encoded in windows-1256, declared in a legacy meta tag.
    const html =
      '<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1256"></head><body><p>' +
      Buffer.from([0xd3, 0xe1, 0xc7, 0xe3]).toString("latin1") +
      "</p></body></html>";
    await writeFile(filePath, Buffer.from(html, "latin1"));

    const result = await extractTextFromHtmlFile(filePath);
    expect(result).toContain("سلام");
  });

  it("extracts Persian text from UTF-16 text files", async () => {
    const filePath = join(TEST_DIR, "unicode.txt");
    const bom = Buffer.from([0xff, 0xfe]);
    const body = Buffer.from("سلام دنیا", "utf16le");
    await writeFile(filePath, Buffer.concat([bom, body]));

    const result = await extractTextFromUtf8File(filePath);
    expect(result).toContain("سلام دنیا");
  });

  it("strips the UTF-8 BOM from text files", async () => {
    const filePath = join(TEST_DIR, "bom.txt");
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const body = Buffer.from("سلام دنیا", "utf8");
    await writeFile(filePath, Buffer.concat([bom, body]));

    const result = await extractTextFromUtf8File(filePath);
    expect(result).toBe("سلام دنیا");
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
