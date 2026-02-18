import { readFile } from "node:fs/promises";
import { convert } from "html-to-text";
import { simpleParser } from "mailparser";
import { readFile as readWorkbookFile, utils as xlsxUtils } from "xlsx";
import { logger } from "@/lib/logger";

const HEX_ESCAPE_REGEX = /\\'([0-9a-fA-F]{2})/g;
const RTF_NEWLINE_REGEX = /\\(?:par|line)\b/g;
const RTF_TAB_REGEX = /\\tab\b/g;
const RTF_UNICODE_REGEX = /\\u(-?\d+)\??/g;
const RTF_CONTROL_WORD_REGEX = /\\[a-zA-Z]+-?\d* ?/g;
const RTF_GROUP_BRACES_REGEX = /[{}]/g;
const THREE_OR_MORE_NEWLINES_REGEX = /\n{3,}/g;

export async function extractTextFromHtmlFile(
  filePath: string
): Promise<string> {
  try {
    const html = await readFile(filePath, "utf8");
    return normalizeText(convertHtmlToText(html));
  } catch (error) {
    logger.error("HTML extraction failed", error, { filePath });
    return "";
  }
}

export async function extractTextFromEml(filePath: string): Promise<string> {
  try {
    const emlBuffer = await readFile(filePath);
    const parsed = await simpleParser(emlBuffer);
    const directText =
      typeof parsed.text === "string" ? normalizeText(parsed.text) : "";
    if (directText.length > 0) {
      return directText;
    }

    let html = "";
    if (typeof parsed.html === "string") {
      html = parsed.html;
    } else if (Buffer.isBuffer(parsed.html)) {
      html = parsed.html.toString("utf8");
    }
    if (html.trim().length > 0) {
      return normalizeText(convertHtmlToText(html));
    }

    return "";
  } catch (error) {
    logger.error("EML extraction failed", error, { filePath });
    return "";
  }
}

export async function extractTextFromRtfFile(
  filePath: string
): Promise<string> {
  try {
    const rtf = await readFile(filePath, "utf8");
    return normalizeText(convertRtfToText(rtf));
  } catch (error) {
    logger.error("RTF extraction failed", error, { filePath });
    return "";
  }
}

export function extractTextFromXlsx(filePath: string): Promise<string> {
  try {
    const workbook = readWorkbookFile(filePath, {
      cellDates: false,
      cellNF: false,
      cellText: true,
    });
    const sections: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        continue;
      }

      const rows = xlsxUtils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
        raw: false,
      }) as unknown[][];

      const lines = rows
        .map((row) =>
          row
            .map((cell) => String(cell ?? "").trim())
            .join("\t")
            .trim()
        )
        .filter((line) => line.length > 0);

      if (lines.length > 0) {
        sections.push(`# ${sheetName}\n${lines.join("\n")}`);
      }
    }

    return Promise.resolve(normalizeText(sections.join("\n\n")));
  } catch (error) {
    logger.error("Spreadsheet extraction failed", error, { filePath });
    return Promise.resolve("");
  }
}

export async function extractTextFromUtf8File(
  filePath: string
): Promise<string> {
  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeText(raw);
  } catch (error) {
    logger.error("UTF-8 text extraction failed", error, { filePath });
    return "";
  }
}

function convertHtmlToText(html: string): string {
  return convert(html, {
    selectors: [{ selector: "a", options: { ignoreHref: true } }],
    wordwrap: false,
  });
}

function convertRtfToText(rtf: string): string {
  const withNewlines = rtf
    .replace(RTF_NEWLINE_REGEX, "\n")
    .replace(RTF_TAB_REGEX, "\t")
    .replace(RTF_UNICODE_REGEX, (_match, code) =>
      String.fromCharCode(normalizeUnicodeCodePoint(Number(code)))
    )
    .replace(HEX_ESCAPE_REGEX, (_match, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
    .replace(RTF_CONTROL_WORD_REGEX, "")
    .replace(RTF_GROUP_BRACES_REGEX, "");

  return withNewlines.replace(THREE_OR_MORE_NEWLINES_REGEX, "\n\n");
}

function normalizeUnicodeCodePoint(value: number): number {
  if (!Number.isFinite(value)) {
    return 32;
  }
  if (value < 0) {
    return 65_536 + value;
  }
  return value;
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}
