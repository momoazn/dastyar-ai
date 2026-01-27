import { FileIcon, Upload, X } from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui";
import { fa } from "@/lib/texts";
import { cn } from "@/lib/utils";

type PdfUploadAreaProps = {
  selectedPdf: File | null;
  pdfFileName: string;
  pdfResult: { page_count: number } | null;
  isDragging: boolean;
  isTranslating: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onRemovePdf: () => void;
};

export function PdfUploadArea({
  selectedPdf,
  pdfFileName,
  pdfResult,
  isDragging,
  isTranslating,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onKeyDown,
  onRemovePdf,
}: PdfUploadAreaProps) {
  if (selectedPdf) {
    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <FileIcon className="h-6 w-6 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">
              {selectedPdf.name}
            </div>
            <div className="text-muted-foreground text-xs">
              {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <Button
            aria-label="Remove PDF"
            className="h-8 w-8 shrink-0"
            onClick={onRemovePdf}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {pdfResult && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
            <div className="font-medium text-sm">
              {fa.translation.pdfSummaryHeader}
            </div>
            <div className="flex flex-col gap-1 text-muted-foreground text-xs">
              <div>{fa.translation.pdfPageCount(pdfResult.page_count)}</div>
              {pdfFileName && (
                <div>{fa.translation.pdfSourceFile(pdfFileName)}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag handlers require div for drag-and-drop functionality
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Drag handlers require div for drag-and-drop functionality
    <div
      className={cn(
        "flex h-full max-h-[360px] min-h-[240px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors md:min-h-[280px]",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 bg-muted/30"
      )}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Drag handlers require div for drag-and-drop functionality
      tabIndex={0}
    >
      <input
        accept=".pdf"
        className="hidden"
        disabled={isTranslating}
        id="pdf-upload"
        onChange={onFileSelect}
        type="file"
      />
      <label
        className="flex cursor-pointer flex-col items-center gap-3 p-6 text-center"
        htmlFor="pdf-upload"
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
            isDragging ? "bg-primary/10" : "bg-muted-foreground/10"
          }`}
        >
          {isDragging ? (
            <Upload className="h-8 w-8 text-primary" />
          ) : (
            <FileIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-sm">
            {isDragging
              ? fa.translation.dropToUpload
              : fa.translation.selectPdf}
          </span>
          <span className="text-muted-foreground text-xs">
            {fa.translation.pdfHint}
          </span>
        </div>
        <div className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 font-medium text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
          {fa.translation.selectFileButton}
        </div>
      </label>
    </div>
  );
}
