import { FileText, Upload } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/error-utils";
import { extractPdfPages } from "@/lib/pdf";
import { fa } from "@/lib/texts";
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
    } catch {
      // If parsing fails, continue without pages; server may still index via fallback
      toast.warning(fa.documents.pdfExtractionFailed);
    }
  }

  return { textContent, pages };
}

async function uploadDocument(
  file: File,
  threadId: number,
  extracted?: {
    textContent?: string;
    pages?: { page: number; text: string }[];
  }
) {
  const { textContent, pages } = extracted ?? {};
  const baseInput = {
    file,
    threadId,
    title: file.name,
  };

  const input = {
    ...baseInput,
    ...(typeof textContent === "string" && textContent.trim().length > 0
      ? { textContent }
      : {}),
    ...(Array.isArray(pages) && pages.length > 0 ? { pages } : {}),
  };

  try {
    return await client.documents.upload(input);
  } catch (error) {
    const message = getErrorMessage(error, "");
    if (!message.includes("Malformed request")) {
      throw error;
    }

    // Fallback retry with the smallest multipart payload for fragile body parsers.
    return await client.documents.upload(baseInput);
  }
}

function showUploadSuccess(
  fileName: string,
  fileType: string,
  indexed: number
) {
  if (fileType === "application/pdf") {
    if (indexed > 0) {
      toast.success(fa.documents.uploadSuccess(fileName, indexed));
    } else {
      toast.success(fa.documents.uploadSuccessPdfNoIndex(fileName));
    }
  } else if (indexed > 0) {
    toast.success(fa.documents.uploadSuccess(fileName, indexed));
  } else {
    toast.success(fa.documents.uploadSuccessNoIndex(fileName));
  }
}

function handleUploadError(err: unknown) {
  const message = getErrorMessage(err, fa.general.unknownError);
  toast.error(`${fa.documents.uploadError}: ${message}`);
}

export function DocumentUploadButton({
  threadId,
  onUploaded,
  onStatusChange,
}: Props) {
  const [isUploading, setUploading] = useState(false);
  const inputId = useId();

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

      const extracted = await processFileContent(file);
      onStatusChange?.({ filename: file.name, phase: "uploading" });
      const res = await uploadDocument(file, threadId, extracted);
      const indexed = res.indexedChunks ?? 0;
      onStatusChange?.({ filename: file.name, phase: "indexing" });

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
              id={inputId}
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
              <label className="cursor-pointer" htmlFor={inputId}>
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
          <p>{fa.documents.attachmentLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
