import { readFile } from "node:fs/promises";
import { convert } from "html-to-text";
import { simpleParser } from "mailparser";
import { readFile as readWorkbookFile, utils as xlsxUtils } from "xlsx";
import { logger } from "@/lib/logger";

const RTF_ANSICPG_REGEX = /\\ansicpg(\d+)/;
const RTF_CONTROL_WORD_NAME_REGEX = /^[a-zA-Z]+/;
const RTF_NEWLINE_REGEX = /\\(?:par|line)\b/g;
const RTF_TAB_REGEX = /\\tab\b/g;
const RTF_UNICODE_REGEX = /\\u(-?\d+)\??/g;
const RTF_CONTROL_WORD_REGEX = /\\[a-zA-Z]+-?\d* ?/g;
const RTF_GROUP_BRACES_REGEX = /[{}]/g;
const RTF_HEX_RUN_REGEX = /(?:\\'[0-9a-fA-F]{2})+/g;
const THREE_OR_MORE_NEWLINES_REGEX = /\n{3,}/g;
// Destination groups whose content is metadata, not document text.
const RTF_SKIP_DESTINATIONS = new Set([
  "colortbl",
  "filetbl",
  "fonttbl",
  "footer",
  "generator",
  "header",
  "info",
  "latentstyles",
  "listoverridetable",
  "listtable",
  "listtemplate",
  "object",
  "pict",
  "pgptbl",
  "rsidtbl",
  "rsidtable",
  "stylesheet",
  "themedata",
  "colorschememapping",
  "xmlnstbl",
]);
const HTML_CHARSET_REGEX = /charset\s*=\s*["']?([a-zA-Z0-9_.:-]+)/i;
const HTML_SNIFF_LENGTH = 2048;
const UTF8_CHARSET_REGEX = /^(?:utf-?8|us-ascii|ascii)$/i;

function stripBom(text: string): string {
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}

/**
 * Decodes a text file buffer honoring a UTF-16 BOM, and strips a UTF-8 BOM.
 * Plain `readFile(path, "utf8")` turns UTF-16 files (Windows Notepad
 * "Unicode") into U+FFFD garbage and leaks the UTF-8 BOM into the text.
 */
function decodeTextFileBuffer(buffer: Buffer): string {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer);
  }
  return stripBom(buffer.toString("utf8"));
}

/**
 * Decodes HTML honoring a declared non-UTF-8 charset (legacy Persian pages
 * are often windows-1256). The declared charset is only trusted when UTF-8
 * decoding is lossy, so clean UTF-8 files with a wrong meta tag keep working.
 */
function decodeHtmlBuffer(buffer: Buffer): string {
  const sniff = buffer.subarray(0, HTML_SNIFF_LENGTH).toString("latin1");
  const charset = HTML_CHARSET_REGEX.exec(sniff)?.[1];
  if (charset && !UTF8_CHARSET_REGEX.test(charset)) {
    const utf8 = buffer.toString("utf8");
    if (utf8.includes("�")) {
      try {
        return stripBom(new TextDecoder(charset).decode(buffer));
      } catch {
        // Unknown charset label: fall through to UTF-8.
      }
    }
    return stripBom(utf8);
  }
  return stripBom(buffer.toString("utf8"));
}

export async function extractTextFromHtmlFile(
  filePath: string
): Promise<string> {
  try {
    const buffer = await readFile(filePath);
    return normalizeText(convertHtmlToText(decodeHtmlBuffer(buffer)));
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
    const buffer = await readFile(filePath);
    return normalizeText(decodeTextFileBuffer(buffer));
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
  const codepage = RTF_ANSICPG_REGEX.exec(rtf)?.[1];
  const withNewlines = stripDestinationGroups(rtf)
    .replace(RTF_NEWLINE_REGEX, "\n")
    .replace(RTF_TAB_REGEX, "\t")
    .replace(RTF_UNICODE_REGEX, (_match, code) =>
      String.fromCharCode(normalizeUnicodeCodePoint(Number(code)))
    )
    .replace(RTF_HEX_RUN_REGEX, (run) => decodeRtfHexRun(run, codepage))
    .replace(RTF_CONTROL_WORD_REGEX, "")
    .replace(RTF_GROUP_BRACES_REGEX, "");

  return withNewlines.replace(THREE_OR_MORE_NEWLINES_REGEX, "\n\n");
}

/**
 * Removes the content of destination groups (font tables, style sheets,
 * pictures, ...). Without this, font names and other metadata leak into the
 * extracted text. Handles `{\destination ...}` and `{\*\destination ...}`.
 */
function stripDestinationGroups(rtf: string): string {
  let out = "";
  const groupStarts: number[] = [];
  const groupDropped: boolean[] = [];
  let i = 0;
  while (i < rtf.length) {
    const ch = rtf[i];
    if (ch === "{") {
      groupStarts.push(out.length);
      groupDropped.push(isSkipDestinationGroup(rtf, i));
      i += 1;
    } else if (ch === "}") {
      const start = groupStarts.pop();
      const dropped = groupDropped.pop();
      if (start !== undefined && dropped) {
        out = out.slice(0, start);
      }
      i += 1;
    } else if (ch === "\\") {
      // Copy the escape (and the character it quotes) verbatim so escaped
      // braces and control words cannot confuse the brace matching.
      out += rtf.slice(i, i + 2);
      i += 2;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

function isSkipDestinationGroup(rtf: string, braceIndex: number): boolean {
  let i = braceIndex + 1;
  if (rtf[i] !== "\\") {
    return false;
  }
  i += 1;
  if (rtf[i] === "*") {
    i += 1;
    if (rtf[i] !== "\\") {
      return false;
    }
    i += 1;
  }
  const match = RTF_CONTROL_WORD_NAME_REGEX.exec(rtf.slice(i));
  return match !== null && RTF_SKIP_DESTINATIONS.has(match[0].toLowerCase());
}

/**
 * Decodes a run of RTF hex escapes (`\'hh\'hh`) as document-codepage bytes.
 * Decoding each byte with `String.fromCharCode` produces mojibake for
 * Persian/Arabic RTF, which stores text as cp1256 hex escapes.
 */
function decodeRtfHexRun(run: string, codepage: string | undefined): string {
  const hex = run.replace(/\\'/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  for (const label of [
    codepage ? `windows-${codepage}` : null,
    "windows-1252",
  ]) {
    if (label === null) {
      continue;
    }
    try {
      return new TextDecoder(label).decode(bytes);
    } catch {
      // Unknown label: try the next one.
    }
  }
  return String.fromCharCode(...bytes);
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
