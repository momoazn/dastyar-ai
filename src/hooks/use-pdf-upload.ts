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

        // Upload directly to PocketBase using FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", file.name);
        formData.append("thread", threadId);

        // Create the PDF record directly in PocketBase
        const record: PdfsResponse = await pb
          .collection("pdfs")
          .create(formData);

        // Get the file URL using PocketBase files service
        const fileUrl = pb.files.getURL(record, record.file);

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
        url: pb.files.getURL(pdf, pdf.file),
      }));
    } catch (error) {
      console.error("Error fetching thread PDFs:", error);
      return [];
    }
  }, []);

  return {
    uploadPDF,
    getThreadPDFs,
    isUploading,
    uploadProgress,
  };
};
