import { z } from "zod";
import {
  attachDocumentToThread,
  createDocument,
  deleteDocument,
  detachDocumentFromThread,
  listThreadDocuments,
} from "@/repositories/documents";
import { saveDocumentFromFile } from "@/services/document-storage";
import { extractTextFromPdf } from "@/services/pdf";
import { indexDocumentPages, indexDocumentText } from "@/services/rag";
import { protectedProcedure } from "./base";

export const documentProcedures = {
  upload: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(File),
        title: z.string().optional(),
        threadId: z.number().optional(),
        // Optional pre-extracted text (e.g., from client-side PDF parsing)
        textContent: z.string().optional(),
        // Optional client-side extracted pages for PDFs
        pages: z
          .array(z.object({ page: z.number(), text: z.string() }))
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { file, title, threadId, textContent, pages } = input;
      const userId = context.user.id;
      const stored = await saveDocumentFromFile(file, file.name);
      const doc = await createDocument({
        title: title || file.name,
        filePath: stored.filePath,
        fileName: stored.fileName,
        mimeType: stored.mimeType,
        userId,
      });

      if (threadId) {
        await attachDocumentToThread({
          threadId,
          documentId: Number(doc.id),
          userId,
        });
      }

      let chunks = 0;
      try {
        if (Array.isArray(pages) && pages.length > 0) {
          chunks = await indexDocumentPages(
            Number(doc.id),
            pages.map((p) => ({ page: p.page, text: p.text }))
          );
        } else if (textContent && textContent.trim().length > 0) {
          chunks = await indexDocumentText(Number(doc.id), textContent);
        } else if (stored.mimeType.includes("pdf")) {
          const p = await extractTextFromPdf(stored.filePath);
          if (p.length > 0) {
            chunks = await indexDocumentPages(Number(doc.id), p);
          }
        }
      } catch (e) {
        console.warn(
          "[documents.upload] indexing failed, continuing without embeddings:",
          e
        );
        chunks = 0;
      }

      return { ...doc, indexedChunks: chunks };
    }),

  attachToThread: protectedProcedure
    .input(z.object({ threadId: z.number(), documentId: z.number() }))
    .handler(async ({ input, context }) => {
      await attachDocumentToThread({ ...input, userId: context.user.id });
      return { ok: true as const };
    }),

  detachFromThread: protectedProcedure
    .input(z.object({ threadId: z.number(), documentId: z.number() }))
    .handler(async ({ input, context }) => {
      await detachDocumentFromThread({ ...input, userId: context.user.id });
      return { ok: true as const };
    }),

  listByThread: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .handler(async ({ input, context }) =>
      listThreadDocuments({
        threadId: input.threadId,
        userId: context.user.id,
      })
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      await deleteDocument(input.id, context.user.id);
      return { ok: true as const };
    }),
};
