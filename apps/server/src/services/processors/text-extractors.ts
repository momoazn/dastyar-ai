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
const LATIN1_CHARSET_REGEX = /^(?:iso-8859-1|latin-?1)$/i;
const CODEPAGE_CHARSET_REGEX = /^(?:windows-|cp-?)?0*(\d{3,5})$/i;
const HTML_SNIFF_LENGTH = 2048;
const UTF8_CHARSET_REGEX = /^(?:utf-?8|us-ascii|ascii)$/i;

// Unicode for high bytes (0x80-0xFF) of windows-1256 and windows-1252, from
// the WHATWG encoding index. Bun's TextDecoder does not support these legacy
// codepages on every platform (CI Linux failed), so we decode with tables.
const CP1256_HIGH_BYTES =
  "\u20ac\u067e\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0679\u2039\u0152\u0686\u0698\u0688\u06af\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u06a9\u2122\u0691\u203a\u0153\u200c\u200d\u06ba\u00a0\u060c\u00a2\u00a3\u00a4\u00a5\u00a6\u00a7\u00a8\u00a9\u06be\u00ab\u00ac\u00ad\u00ae\u00af\u00b0\u00b1\u00b2\u00b3\u00b4\u00b5\u00b6\u00b7\u00b8\u00b9\u061b\u00bb\u00bc\u00bd\u00be\u061f\u06c1\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062a\u062b\u062c\u062d\u062e\u062f\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u00d7\u0637\u0638\u0639\u063a\u0640\u0641\u0642\u0643\u00e0\u0644\u00e2\u0645\u0646\u0647\u0648\u00e7\u00e8\u00e9\u00ea\u00eb\u0649\u064a\u00ee\u00ef\u064b\u064c\u064d\u064e\u00f4\u064f\u0650\u00f7\u0651\u00f9\u0652\u00fb\u00fc\u200e\u200f\u06d2";
const CP1252_HIGH_BYTES =
  "\u20ac\u0081\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u008d\u017d\u008f\u0090\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u009d\u017e\u0178\u00a0\u00a1\u00a2\u00a3\u00a4\u00a5\u00a6\u00a7\u00a8\u00a9\u00aa\u00ab\u00ac\u00ad\u00ae\u00af\u00b0\u00b1\u00b2\u00b3\u00b4\u00b5\u00b6\u00b7\u00b8\u00b9\u00ba\u00bb\u00bc\u00bd\u00be\u00bf\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5\u00c6\u00c7\u00c8\u00c9\u00ca\u00cb\u00cc\u00cd\u00ce\u00cf\u00d0\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6\u00d7\u00d8\u00d9\u00da\u00db\u00dc\u00dd\u00de\u00df\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u00e6\u00e7\u00e8\u00e9\u00ea\u00eb\u00ec\u00ed\u00ee\u00ef\u00f0\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f7\u00f8\u00f9\u00fa\u00fb\u00fc\u00fd\u00fe\u00ff";

/**
 * Decodes bytes as a single-byte Windows codepage. Only cp1252 (Latin) and
 * cp1256 (Persian/Arabic) are supported; anything else falls back to cp1252.
 * shortcut: no multi-byte codepages (cp936/cp932), add real iconv if needed.
 */
function decodeSingleByteTable(buffer: Uint8Array, table: string): string {
  let out = "";
  for (const byte of buffer) {
    out += byte < 0x80 ? String.fromCharCode(byte) : table[byte - 0x80];
  }
  return out;
}

function tableForCodepage(codepage: number): string {
  return codepage === 1256 ? CP1256_HIGH_BYTES : CP1252_HIGH_BYTES;
}

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
 * Unknown codepages fall back to cp1252, as in RTF decoding.
 */
function decodeHtmlBuffer(buffer: Buffer): string {
  const sniff = buffer.subarray(0, HTML_SNIFF_LENGTH).toString("latin1");
  const charset = HTML_CHARSET_REGEX.exec(sniff)?.[1] ?? "";
  const codepage =
    charset && !UTF8_CHARSET_REGEX.test(charset)
      ? codepageForCharset(charset)
      : null;
  if (codepage === null) {
    return stripBom(buffer.toString("utf8"));
  }
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("�")) {
    return stripBom(utf8);
  }
  return stripBom(decodeSingleByteTable(buffer, tableForCodepage(codepage)));
}

/**
 * Maps a declared charset label to a codepage number we have a table for.
 * Latin aliases (iso-8859-1/latin-1) map to cp1252, as browsers do.
 */
function codepageForCharset(charset: string): number | null {
  if (LATIN1_CHARSET_REGEX.test(charset)) {
    return 1252;
  }
  const match = CODEPAGE_CHARSET_REGEX.exec(charset);
  return match ? Number(match[1]) : null;
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
 * Persian/Arabic RTF, which stores text as cp1256 hex escapes. Unknown
 * codepages fall back to cp1252.
 */
function decodeRtfHexRun(run: string, codepage: string | undefined): string {
  const hex = run.replace(/\\'/g, "");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return decodeSingleByteTable(bytes, tableForCodepage(Number(codepage)));
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
