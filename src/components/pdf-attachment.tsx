import { Paperclip, X, FileText, Loader2 } from "lucide-react";
import { useCallback, useRef } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import type { UploadedPDF } from "@/hooks/use-pdf-upload";

interface PDFAttachmentProps {
  attachedPDFs: UploadedPDF[];
  onFileSelect: (file: File) => void;
  onRemovePDF: (pdfId: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  disabled?: boolean;
}

export function PDFAttachment({
  attachedPDFs,
  onFileSelect,
  onRemovePDF,
  isUploading,
  uploadProgress,
  disabled = false,
}: PDFAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileSelect],
  );

  return (
    <div className="space-y-2">
      {/* Attached PDFs List */}
      {attachedPDFs.length > 0 && (
        <div className="space-y-1">
          {attachedPDFs.map((pdf) => (
            <div
              key={pdf.id}
              className="bg-muted/50 flex items-center gap-2 rounded-md p-2 text-sm"
            >
              <FileText className="text-muted-foreground h-4 w-4" />
              <span className="flex-1 truncate" title={pdf.filename}>
                {pdf.filename}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onRemovePDF(pdf.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-md p-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="flex-1">
            {PERSIAN_TEXTS.attachments.uploading}... {uploadProgress}%
          </span>
        </div>
      )}

      {/* Attachment Button */}
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className={cn("h-8 w-8", disabled && "cursor-not-allowed opacity-50")}
          onClick={handleAttachClick}
          disabled={disabled || isUploading}
          title={PERSIAN_TEXTS.attachments.attachPDF}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
