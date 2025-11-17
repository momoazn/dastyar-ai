import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { extractPdfPages } from "@/lib/pdf";
import { client, queryClient } from "@/utils/orpc";

type Props = {
  threadId: number;
  onUploaded?: (payload: {
    id: number;
    title: string;
    indexedChunks: number;
  }) => void;
  onStatusChange?: (s: {
    filename: string;
    phase: "extracting" | "uploading" | "indexing" | "done" | "error";
  }) => void;
};

async function processFileContent(file: File): Promise<{
  textContent?: string;
  pages?: { page: number; text: string }[];
}> {
  let textContent: string | undefined;
  let pages: { page: number; text: string }[] | undefined;

  if (file.type === "text/plain" || file.type === "text/markdown") {
    textContent = await file.text();
  } else if (file.type === "application/pdf") {
    try {
      pages = await extractPdfPages(file);
    } catch (_error) {
      // If parsing fails, continue without pages; server may still index via fallback
    }
  }

  return { textContent, pages };
}

async function uploadDocument(
  file: File,
  threadId: number,
  textContent?: string,
  pages?: { page: number; text: string }[]
) {
  return await client.documents.upload({
    file,
    threadId,
    title: file.name,
    textContent,
    pages,
  });
}

function showUploadSuccess(
  fileName: string,
  fileType: string,
  indexed: number
) {
  if (fileType === "application/pdf") {
    if (indexed > 0) {
      toast.success(`«${fileName}» بارگذاری و ایندکس شد (${indexed} قطعه).`);
    } else {
      toast.success(`فایل «${fileName}» بارگذاری شد. (ایندکس PDF انجام نشد)`);
    }
  } else if (indexed > 0) {
    toast.success(`«${fileName}» بارگذاری و ایندکس شد (${indexed} قطعه).`);
  } else {
    toast.success(`فایل «${fileName}» بارگذاری شد.`);
  }
}

function handleUploadError(err: unknown) {
  const message = err instanceof Error ? err.message : "خطای ناشناخته";
  toast.error(`خطا در آپلود فایل: ${message}`);
}

export function DocumentUploadButton({
  threadId,
  onUploaded,
  onStatusChange,
}: Props) {
  const [isUploading, setUploading] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      if (file.type === "application/pdf") {
        onStatusChange?.({ filename: file.name, phase: "extracting" });
      } else {
        onStatusChange?.({ filename: file.name, phase: "uploading" });
      }

      const { textContent, pages } = await processFileContent(file);

      onStatusChange?.({ filename: file.name, phase: "indexing" });
      const res = await uploadDocument(file, threadId, textContent, pages);
      const indexed = res.indexedChunks ?? 0;

      onUploaded?.({
        id: Number(res.id),
        title: res.title,
        indexedChunks: indexed,
      });

      queryClient.invalidateQueries();
      onStatusChange?.({ filename: file.name, phase: "done" });
      showUploadSuccess(file.name, file.type, indexed);
    } catch (err) {
      handleUploadError(err);
      onStatusChange?.({ filename: file.name, phase: "error" });
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <input
              accept=".pdf,.txt,.md"
              className="hidden"
              id="doc-upload-input"
              onChange={handleSelect}
              type="file"
            />
            <Button
              asChild
              className="h-9 w-9 p-0"
              disabled={isUploading}
              size="icon"
              variant="outline"
            >
              <label className="cursor-pointer" htmlFor="doc-upload-input">
                {isUploading ? (
                  <Upload className="size-4 animate-pulse" />
                ) : (
                  <FileText className="size-4" />
                )}
              </label>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>پیوست سند (PDF, TXT, MD)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
