import { readFile } from "node:fs/promises";
import { logger } from "@/lib/logger";
import { ensurePdfjsNodePolyfills } from "@/lib/pdfjs-node-polyfills";

export type PdfPage = { page: number; text: string };

type PdfParseModule = typeof import("pdf-parse");

let pdfParseModule: Promise<PdfParseModule> | null = null;

async function getPdfParse(): Promise<PdfParseModule> {
  // Ensure required DOM-like globals exist before pdf.js initializes.
  ensurePdfjsNodePolyfills();
  if (!pdfParseModule) {
    pdfParseModule = import("pdf-parse");
  }
  return await pdfParseModule;
}

/**
 * Extract text from a PDF using pdf-parse library.
 * Returns an array of pages with extracted text.
 */
export async function extractTextFromPdf(filePath: string): Promise<PdfPage[]> {
  try {
    const dataBuffer = await readFile(filePath);
    const { PDFParse } = await getPdfParse();
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();

    // Map the TextResult pages to our PdfPage format
    const pages: PdfPage[] = result.pages
      .map((pageResult) => ({
        page: pageResult.num,
        text: normalizeWhitespace(pageResult.text),
      }))
      .filter((page) => page.text.trim().length > 0);

    return pages;
  } catch (error) {
    logger.error("PDF extraction failed", error, { filePath });
    return [];
  }
}

function normalizeWhitespace(s: string): string {
  // Convert Windows newlines, collapse excessive blanks while keeping paragraphs
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[\t\v\f]+/g, " ")
    .replace(/\u00A0/g, " ");
}
