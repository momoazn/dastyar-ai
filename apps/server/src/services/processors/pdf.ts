import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";

export type PdfPage = { page: number; text: string };

/**
 * Extract text from a PDF using pdf-parse library.
 * Returns an array of pages with extracted text.
 */
export async function extractTextFromPdf(filePath: string): Promise<PdfPage[]> {
  try {
    const dataBuffer = await readFile(filePath);
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
    console.error("PDF extraction failed:", error);
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
