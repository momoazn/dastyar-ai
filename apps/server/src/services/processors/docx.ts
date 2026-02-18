import { logger } from "@/lib/logger";

type MammothModule = typeof import("mammoth");

let mammothModule: Promise<MammothModule> | null = null;

async function getMammoth(): Promise<MammothModule> {
  if (!mammothModule) {
    mammothModule = import("mammoth");
  }
  return await mammothModule;
}

export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    const mammoth = await getMammoth();
    const result = await mammoth.extractRawText({ path: filePath });
    const text = normalizeWhitespace(result.value);

    if (result.messages.length > 0) {
      logger.debug("DOCX extraction completed with parser messages", {
        filePath,
        messageCount: result.messages.length,
      });
    }

    return text.trim();
  } catch (error) {
    logger.error("DOCX extraction failed", error, { filePath });
    return "";
  }
}

function normalizeWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[\t\v\f]+/g, " ");
}
