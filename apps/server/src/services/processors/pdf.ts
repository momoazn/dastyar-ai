import { existsSync } from "node:fs";
import path from "node:path";

// Regex for extracting page count from pdfinfo output
const PAGES_REGEX = /Pages:\s*(\d+)/i;

async function run(
  cmd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    // Prefer Bun.spawn when available to avoid Node child_process
    const proc = Bun.spawn({
      cmd: [cmd, ...args],
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { stdout, stderr, code };
  } catch (e) {
    return { stdout: "", stderr: String(e ?? "error"), code: 127 };
  }
}

function sanitizePath(p: string): string {
  // Ensure path exists and is a file, avoid attempting commands on directories
  if (!existsSync(p)) {
    return p;
  }
  return path.resolve(p);
}

export type PdfPage = { page: number; text: string };

/**
 * Extract text from a PDF using poppler utilities if available.
 * 1) Tries to get page count via `pdfinfo` and then extract each page via `pdftotext`.
 * 2) Falls back to a single pass `pdftotext file -` if `pdfinfo` is not available.
 * 3) Returns empty array if extraction fails.
 */
export async function extractTextFromPdf(filePath: string): Promise<PdfPage[]> {
  const resolved = sanitizePath(filePath);

  // Try to get page count
  const info = await run("pdfinfo", [resolved]);
  if (info.code === 0) {
    const m = PAGES_REGEX.exec(info.stdout);
    const pages = m ? Number.parseInt(m[1], 10) : Number.NaN;
    if (Number.isFinite(pages) && pages > 0) {
      const out: PdfPage[] = [];
      for (let p = 1; p <= pages; p++) {
        const r = await run("pdftotext", [
          "-enc",
          "UTF-8",
          "-q",
          "-f",
          String(p),
          "-l",
          String(p),
          resolved,
          "-",
        ]);
        if (r.code === 0) {
          const text = normalizeWhitespace(r.stdout);
          out.push({ page: p, text });
        } else {
          // If any page fails, keep going, we still index others
          out.push({ page: p, text: "" });
        }
      }
      return out.filter((x) => x.text.trim().length > 0);
    }
  }

  // Fallback: single pass pdftotext stdout
  const r = await run("pdftotext", ["-enc", "UTF-8", "-q", resolved, "-"]);
  if (r.code === 0) {
    const text = normalizeWhitespace(r.stdout);
    return text.trim() ? [{ page: 1, text }] : [];
  }
  return [];
}

function normalizeWhitespace(s: string): string {
  // Convert Windows newlines, collapse excessive blanks while keeping paragraphs
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[\t\v\f]+/g, " ")
    .replace(/\u00A0/g, " ");
}
