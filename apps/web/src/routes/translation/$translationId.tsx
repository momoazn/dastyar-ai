import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  Alert,
  Badge,
  Button,
  Card,
  ScrollArea,
  Textarea,
} from "@/components/ui";
import { useTranslationModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { createLanguageOptions, createToneOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { TranslationPayload } from "@/server/database/schema";
import { orpc } from "@/utils/orpc";

// Precompute selection option lists
const languageOptions = createLanguageOptions();
const toneOptions = createToneOptions();

export const Route = createFileRoute("/translation/$translationId")({
  component: () => (
    <ProtectedLayout>
      <TranslationHistoryView />
    </ProtectedLayout>
  ),
});

function TranslationHistoryView() {
  const { translationId: id } = Route.useParams();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);

  const translationId = Number.parseInt(id, 10);

  const { data: translationData, isLoading } = useQuery(
    orpc.translations.get.queryOptions({
      input: { id: translationId },
    })
  );

  const { models } = useTranslationModelSelection();

  // Helper functions to get labels
  const getLanguageLabel = (code: string) =>
    languageOptions.find((lang) => lang.value === code)?.label ?? code;

  const getToneLabel = (tone: string) =>
    toneOptions.find((t) => t.value === tone)?.label ?? tone;

  const getModelName = (modelId: number) =>
    models?.find((m) => m.id === modelId)?.identifier ?? `Model #${modelId}`;

  const handleCopyToNew = () => {
    navigate({
      to: "/translation/",
      search: { fromId: translationId },
    });
  };

  const handleCopyText = async () => {
    if (!translationData?.translatedText) return;
    try {
      await navigator.clipboard.writeText(translationData.translatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  if (isLoading) {
    return (
      <ToolScaffold
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">
              {fa.general.loadingModels}
            </div>
          </div>
        }
      />
    );
  }

  if (!translationData) {
    return (
      <ToolScaffold
        alerts={
          <Alert variant="destructive">
            <span>Translation not found</span>
          </Alert>
        }
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Translation not found</div>
          </div>
        }
      />
    );
  }

  const isPdfMode = (translationData.sourceType as string) === "pdf";
  const pdfResult = translationData.payload as TranslationPayload | null;

  return (
    <ToolScaffold
      content={
        <div className="flex h-full flex-col gap-6">
          {/* Title Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-2xl">
                {fa.index.translationTitle} - {fa.general.history}
              </h1>
              <Button
                className="gap-2"
                onClick={handleCopyToNew}
                type="button"
                variant="outline"
              >
                <span className="text-sm">{fa.translation.copyToNew}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Translation Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.sourceLanguage}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getLanguageLabel(translationData.sourceLanguage as string)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.targetLanguage}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getLanguageLabel(translationData.targetLanguage as string)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.translationTone}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getToneLabel(translationData.tone as string)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{fa.translation.model}</div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getModelName(translationData.modelId as number)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{fa.translation.type}</div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {isPdfMode ? "PDF" : fa.translation.text}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div
            className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2"
            dir="rtl"
          >
            {/* Source Column (Right) */}
            <Card className="flex flex-col py-0 lg:order-1">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {fa.translation.sourceLanguage}
                  </span>
                  <Badge variant="secondary">{fa.translation.readOnly}</Badge>
                </div>
              </div>
              <div className="flex-1 p-4">
                {isPdfMode && pdfResult ? (
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                        <FileText className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-sm">
                          {translationData.sourceFileName ?? "PDF File"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
                      <div className="font-medium text-sm">
                        {fa.translation.pdfSummaryHeader}
                      </div>
                      <div className="flex flex-col gap-1 text-muted-foreground text-xs">
                        <div>
                          {fa.translation.pdfPageCount(pdfResult.page_count)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                    dir={
                      translationData.sourceText
                        ? detectTextDirection(translationData.sourceText)
                        : "rtl"
                    }
                    readOnly
                    value={translationData.sourceText ?? ""}
                  />
                )}
              </div>
            </Card>

            {/* Result Column (Left) */}
            <Card className="flex flex-col py-0 lg:order-2">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {fa.translation.translatedText}
                  </span>
                  <div className="flex items-center gap-2">
                    {translationData.translatedText && (
                      <Button
                        className={
                          isCopied ? "bg-green-600 hover:bg-green-700" : ""
                        }
                        onClick={handleCopyText}
                        size="sm"
                        type="button"
                        variant={isCopied ? "default" : "ghost"}
                      >
                        <Copy className="h-4 w-4" />
                        {isCopied ? fa.summarize.copied : fa.summarize.copy}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-4">
                {isPdfMode && pdfResult && pdfResult.pages.length > 0 ? (
                  <div className="flex h-full max-h-[600px] min-h-[300px] flex-col gap-4 overflow-auto">
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
                          const textDir = detectTextDirection(
                            page.translated_text
                          );
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
                ) : (
                  <Textarea
                    className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                    dir={
                      translationData.translatedText
                        ? detectTextDirection(translationData.translatedText)
                        : "rtl"
                    }
                    readOnly
                    value={translationData.translatedText ?? ""}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      }
    />
  );
}
