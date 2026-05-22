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
import { fa } from "@/lib/texts";
import { client, orpc, queryClient } from "@/utils/orpc";

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

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/tab-separated-values",
  "application/json",
  "text/xml",
  "application/xml",
  "text/html",
  "application/xhtml+xml",
  "application/rtf",
  "text/rtf",
  "message/rfc822",
  "text/yaml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "text/x-toml",
]);
const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "html",
  "htm",
  "xml",
  "eml",
  "rtf",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "log",
  "sql",
  "py",
  "ts",
  "tsx",
  "java",
  "go",
  "rs",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "cs",
  "rb",
  "php",
  "swift",
  "kt",
  "kts",
  "scala",
  "lua",
  "r",
  "m",
]);
const SUPPORTED_ACCEPT = [
  ".pdf",
  ".docx",
  ".xls",
  ".xlsx",
  ".xlsm",
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".eml",
  ".rtf",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".conf",
  ".log",
  ".sql",
  ".py",
  ".ts",
  ".tsx",
  ".java",
  ".go",
  ".rs",
  ".c",
  ".cc",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".kts",
  ".scala",
  ".lua",
  ".r",
  ".m",
].join(",");

type UploadResponse = {
  id: number | string;
  indexedChunks?: number | null;
  indexingReason?: string;
  title: string;
};

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

function getExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

function isTextLikeFile(file: File): boolean {
  const mime = normalizeMimeType(file.type);
  return (
    TEXT_MIME_TYPES.has(mime) || TEXT_EXTENSIONS.has(getExtension(file.name))
  );
}

async function processFileContent(file: File): Promise<{
  textContent?: string;
}> {
  let textContent: string | undefined;

  if (isTextLikeFile(file)) {
    textContent = await file.text();
  }

  return { textContent };
}

async function uploadDocument(
  file: File,
  threadId: number,
  extracted?: {
    textContent?: string;
  }
) {
  const { textContent } = extracted ?? {};
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
  indexed: number,
  indexingReason?: string
) {
  if (indexed > 0) {
    toast.success(fa.documents.uploadSuccess(fileName, indexed));
    return;
  }

  if (indexingReason) {
    toast.success(
      fa.documents.uploadSuccessNoIndexWithReason(
        fileName,
        indexingReasonToText(indexingReason)
      )
    );
    return;
  }

  if (fileType === "application/pdf") {
    toast.success(fa.documents.uploadSuccessPdfNoIndex(fileName));
  } else {
    toast.success(fa.documents.uploadSuccessNoIndex(fileName));
  }
}

function indexingReasonToText(reason: string): string {
  switch (reason) {
    case "unsupported_file_type":
      return fa.documents.indexingReasonUnsupportedType;
    case "no_extractable_content":
      return fa.documents.indexingReasonNoContent;
    case "indexing_failed":
      return fa.documents.indexingReasonFailed;
    default:
      return fa.documents.indexingReasonUnknown;
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
      onStatusChange?.({ filename: file.name, phase: "extracting" });
      const extracted = await processFileContent(file);
      onStatusChange?.({ filename: file.name, phase: "uploading" });
      const res = (await uploadDocument(
        file,
        threadId,
        extracted
      )) as UploadResponse;
      const indexed = res.indexedChunks ?? 0;
      onStatusChange?.({ filename: file.name, phase: "indexing" });

      onUploaded?.({
        id: Number(res.id),
        title: res.title,
        indexedChunks: indexed,
      });

      await queryClient.invalidateQueries({
        queryKey: orpc.documents.listByThread.queryKey({
          input: { threadId },
        }),
      });
      onStatusChange?.({ filename: file.name, phase: "done" });
      showUploadSuccess(file.name, file.type, indexed, res.indexingReason);
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
              accept={SUPPORTED_ACCEPT}
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
          <p className="mt-1 max-w-72 text-muted-foreground text-xs">
            {fa.documents.supportedFormatsHint}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
