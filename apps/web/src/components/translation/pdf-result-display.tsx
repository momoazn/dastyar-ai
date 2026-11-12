import { FileText, Loader2 } from "lucide-react";
import { Badge, Card, ScrollArea } from "@/components/ui";
import { fa } from "@/lib/texts";
import { detectTextDirection } from "@/lib/utils";
import type { TranslationPayload } from "@/server/database/schema";

type PdfResultDisplayProps = {
  translatedText: string;
  pdfResult: TranslationPayload | null;
  isTranslating: boolean;
  isCopied: boolean;
  onCopy: () => void;
};

export function PdfResultDisplay({
  translatedText,
  pdfResult,
  isTranslating,
  isCopied: _isCopied,
  onCopy: _onCopy,
}: PdfResultDisplayProps) {
  if (isTranslating) {
    return (
      <div className="flex h-full max-h-[400px] min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground text-sm">
            {fa.translation.translating}
          </div>
        </div>
      </div>
    );
  }

  if (pdfResult && pdfResult.pages.length > 0) {
    return (
      <div className="flex h-full max-h-[400px] min-h-[300px] flex-col gap-4 overflow-auto">
        <div
          className="flex items-center gap-3 rounded-lg border bg-green-500/10 p-4"
          dir="rtl"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">
              {fa.translation.translationCompleted}
            </div>
            <div className="text-green-600/80 text-xs">
              {fa.translation.pagesTranslated(pdfResult.page_count)}
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 pr-2">
          <div className="flex flex-col gap-3">
            {pdfResult.pages.map((page) => {
              const textDir = detectTextDirection(page.translated_text);
              return (
                <Card className="p-4" dir={textDir} key={page.page}>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className="text-xs" variant="secondary">
                      {fa.translation.pdfPageLabel(page.page)}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {page.translated_text}
                  </p>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (translatedText) {
    return (
      <div className="flex h-full max-h-[400px] min-h-[300px] flex-col gap-4 overflow-auto">
        <div
          className="flex items-center gap-3 rounded-lg border bg-green-500/10 p-4"
          dir="rtl"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-500/20">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm">
              {fa.translation.translationCompleted}
            </div>
            {pdfResult && (
              <div className="text-green-600/80 text-xs">
                {fa.translation.pagesTranslated(pdfResult.page_count)}
              </div>
            )}
          </div>
        </div>
        <textarea
          aria-label={fa.translation.translatedText}
          className="min-h-[140px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
          dir={detectTextDirection(translatedText)}
          readOnly
          value={translatedText}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[400px] min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/30">
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-sm">
            {fa.translation.pdfAwaitingUpload}
          </span>
          <span className="text-muted-foreground text-xs">
            {fa.translation.selectPdfToStart}
          </span>
        </div>
      </div>
    </div>
  );
}
