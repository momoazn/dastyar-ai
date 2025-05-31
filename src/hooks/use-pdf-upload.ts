import { useCallback, useState } from "react";
import { pb } from "@/lib/pocketbase";
import type { PdfsResponse } from "@/lib/pocketbase-types";

export interface UploadedPDF {
  id: string;
  filename: string;
  file: string;
  url: string;
}

export const usePDFUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPDF = useCallback(
    async (file: File, threadId: string): Promise<UploadedPDF | null> => {
      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Use the Hono API endpoint for upload
        const formData = new FormData();
        formData.append("pdf", file);
        formData.append("threadId", threadId);

        const response = await fetch("/api/pdf/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }

        // Get the PDF record from PocketBase
        const record: PdfsResponse = await pb.collection("pdfs").getOne(result.pdfId);
        const fileUrl = pb.files.getUrl(record, record.file);

        setUploadProgress(100);

        return {
          id: record.id,
          filename: record.filename,
          file: record.file,
          url: fileUrl,
        };
      } catch (error) {
        console.error("PDF upload error:", error);
        return null;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [],
  );

  const getThreadPDFs = useCallback(async (threadId: string) => {
    try {
      // Directly get PDFs for this thread using the new schema
      const pdfs = await pb.collection("pdfs").getFullList({
        filter: `thread = "${threadId}"`,
      });

      return pdfs.map((pdf) => ({
        id: pdf.id,
        filename: pdf.filename,
        file: pdf.file,
        url: pb.files.getUrl(pdf, pdf.file),
      }));
    } catch (error) {
      console.error("Error fetching thread PDFs:", error);
      return [];
    }
  }, []);

  const deletePDF = useCallback(async (pdfId: string) => {
    try {
      // Use the Hono API endpoint for deletion
      const response = await fetch(`/api/pdf/${pdfId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error deleting PDF:", error);
      return false;
    }
  }, []);

  return {
    uploadPDF,
    getThreadPDFs,
    deletePDF,
    isUploading,
    uploadProgress,
  };
}; 