// Client-side PDF text extraction via pdfjs-dist
// Note: Requires pdfjs-dist dependency in the web app

export type PdfPageText = { page: number; text: string };

export async function extractPdfPages(file: File): Promise<PdfPageText[]> {
  if (file.type !== "application/pdf") {
    return [];
  }

  // Lazy import pdfjs to avoid growing initial bundle
  // Set worker via Vite ?url to resolve to an asset URL
  const [{ GlobalWorkerOptions, getDocument }, workerUrl] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);

  // @ts-expect-error - pdfjs types vary, but url string is accepted
  GlobalWorkerOptions.workerSrc = workerUrl.default || workerUrl;

  const data = await file.arrayBuffer();
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;

  const out: PdfPageText[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // Narrow union TextItem | TextMarkedContent to items that contain a string 'str'
    const text = normalizePdfText(
      (content.items || [])
        .map((i: unknown) =>
          i && typeof i === "object" && "str" in (i as Record<string, unknown>)
            ? String((i as Record<string, unknown>).str ?? "")
            : ""
        )
        .join(" ")
    );
    if (text.trim()) {
      out.push({ page: p, text });
    }
  }
  return out;
}

function normalizePdfText(s: string): string {
  // collapse multiple spaces but keep paragraph markers as best we can
  const collapsed = s.replace(/\u00A0/g, " ").replace(/[\t\v\f]+/g, " ");
  // Heuristic: inject newlines where sentence boundaries seem likely
  return collapsed.replace(/([.!?\u06D4\u061F])\s+/g, "$1\n");
}
