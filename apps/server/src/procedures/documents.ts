import { z } from "zod";
import {
  FileValidationError,
  validateUploadedFile,
} from "@/lib/file-validation";
import { logger } from "@/lib/logger";
import {
  attachDocumentToThread,
  createDocument,
  deleteDocument,
  detachDocumentFromThread,
  listThreadDocuments,
} from "@/repositories/documents";
import { indexUploadedDocument } from "@/services/processors";
import { saveDocumentFromFile } from "@/services/storage";
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

      // Validate the uploaded file
      try {
        await validateUploadedFile(file);
      } catch (error) {
        if (error instanceof FileValidationError) {
          logger.warn("File validation failed", {
            filename: file.name,
            size: file.size,
            error: error.message,
            code: error.code,
            userId,
          });
          throw new Error(`File validation failed: ${error.message}`);
        }
        throw error;
      }

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

      const indexing = await indexUploadedDocument({
        clientPages: pages,
        clientTextContent: textContent,
        documentId: Number(doc.id),
        fileName: file.name,
        filePath: stored.filePath,
        mimeType: stored.mimeType,
        userId,
      });

      return {
        ...doc,
        indexedChunks: indexing.chunks,
        indexingReason: indexing.reason,
        indexingSource: indexing.source,
        indexingStatus: indexing.status,
      };
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
