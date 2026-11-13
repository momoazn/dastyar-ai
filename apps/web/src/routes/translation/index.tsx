import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Copy, Loader2, SendIcon } from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  PRIMARY_ACTION_CLASS,
  ToolGrid,
  ToolPageHeader,
  ToolPanel,
} from "@/components/tool-page/tool-page";
import { PdfResultDisplay } from "@/components/translation/pdf-result-display";
import { PdfUploadArea } from "@/components/translation/pdf-upload-area";
import { TranslationResult } from "@/components/translation/translation-result";
import { TranslationSettings } from "@/components/translation/translation-settings";
import { TranslationTextInput } from "@/components/translation/translation-text-input";
import { Alert, Button } from "@/components/ui";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTranslationModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { getErrorMessage as extractErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import type {
  LanguageCode,
  Tone,
  TranslationPayload,
} from "@/server/database/schema";
import { orpc, queryClient } from "@/utils/orpc";

// Search params shape for this route
type TranslationSearch = { fromId?: number | string };

/**
 * Normalize and validate translation id from search (accepts number or string).
 * Returns 0 when id is not a valid positive integer.
 */
function parseTranslationId(value: number | string | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
}

/** Determine whether the pressed keys indicate submit (Cmd/Ctrl+Enter). */
function isSubmitShortcut(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && e.key === "Enter";
}

export const Route = createFileRoute("/translation/")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

function RouteComponent() {
  const search = useSearch({ from: "/translation/" }) as TranslationSearch;
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [mode, setMode] = useState<"text" | "pdf">("text");
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfResult, setPdfResult] = useState<TranslationPayload | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("en");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("fa");
  const [tone, setTone] = useState<Tone>("formal");
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const {
    modelId,
    setModelId,
    models,
    isLoading: isModelsLoading,
    error: modelsError,
  } = useTranslationModelSelection();

  const translationId = parseTranslationId(search.fromId);
  const hasTranslationId = translationId > 0;

  // Load translation if fromId is provided in URL (for copying)
  const { data: translationData } = useQuery(
    orpc.translations.get.queryOptions({
      input: { id: translationId },
      enabled: hasTranslationId,
    })
  );

  const translateMutation = useMutation(
    orpc.translations.translate.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.translations.list.queryKey(),
        });
        setTranslatedText(data.translatedText ?? "");
        // Stay on the same page to allow quick iterations
      },
    })
  );

  const translatePdfMutation = useMutation(
    orpc.translations.translatePdf.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.translations.list.queryKey(),
        });
        setPdfError(null);
        setPdfResult((data.payload as TranslationPayload) ?? null);
        setTranslatedText(data.translatedText ?? "");
        // Stay on the same page to allow quick iterations
      },
    })
  );

  // Load translation data when URL id changes
  useEffect(() => {
    if (!translationData) {
      return;
    }
    setTranslatedText(translationData.translatedText || "");
    setSourceLanguage(translationData.sourceLanguage as LanguageCode);
    setTargetLanguage(translationData.targetLanguage as LanguageCode);
    setTone((translationData.tone as Tone) || "formal");
    if (typeof translationData.modelId === "number") {
      setModelId(translationData.modelId);
    }

    if ((translationData.sourceType as string) === "pdf") {
      setMode("pdf");
      setPdfResult((translationData.payload as TranslationPayload) ?? null);
      setPdfFileName(translationData.sourceFileName ?? "");
      setSourceText("");
      setSelectedPdf(null);
    } else {
      setMode("text");
      setSourceText(translationData.sourceText || "");
      setPdfResult(null);
      setPdfFileName("");
      setSelectedPdf(null);
    }
  }, [setModelId, translationData]);

  /**
   * Swap source/target languages and move translated text into the source area.
   */
  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    if (mode === "text") {
      setSourceText(translatedText);
      setTranslatedText("");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setClipboardError(null);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setClipboardError(fa.general.clipboardCopyFailed);
      setIsCopied(false);
    }
  };

  const handlePdfSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    validateAndSetPdf(file);
    event.target.value = "";
  };

  const validateAndSetPdf = (file: File) => {
    if (file.type !== "application/pdf") {
      setPdfError(fa.translation.pdfInvalidFile);
      setSelectedPdf(null);
      setPdfResult(null);
      setPdfFileName("");
      return;
    }
    setPdfError(null);
    setMode("pdf");
    setSelectedPdf(file);
    setPdfFileName(file.name);
    setPdfResult(null);
    setTranslatedText("");
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isTranslating) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isTranslating) {
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetPdf(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isTranslating) {
        document.getElementById("pdf-upload")?.click();
      }
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
    setPdfResult(null);
    setPdfFileName("");
    setTranslatedText("");
    setPdfError(null);
  };

  /**
   * Submit translation request using current inputs.
   */
  const submitTextTranslation = () => {
    translateMutation.mutate({
      text: sourceText,
      sourceLanguage,
      targetLanguage,
      tone,
      modelId: modelId || 0,
    });
  };

  const submitPdfTranslation = () => {
    if (!selectedPdf) {
      return;
    }
    translatePdfMutation.mutate({
      file: selectedPdf,
      sourceLanguage,
      targetLanguage,
      tone,
      modelId: modelId || 0,
    });
  };

  /**
   * Keyboard shortcut handler for submitting with Cmd/Ctrl+Enter.
   */
  const handleSourceKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSubmitShortcut(e)) {
      e.preventDefault();
      submitTextTranslation();
    }
  };

  const isTranslatingText = translateMutation.isPending;
  const isTranslatingPdf = translatePdfMutation.isPending;
  const isTranslating = isTranslatingText || isTranslatingPdf;

  const canTranslateText =
    Boolean(sourceText.trim() && modelId && !isModelsLoading) && !isTranslating;
  const canTranslatePdf =
    Boolean(selectedPdf && modelId && !isModelsLoading) && !isTranslating;
  const actionDisabled = mode === "pdf" ? !canTranslatePdf : !canTranslateText;
  const actionHandler =
    mode === "pdf" ? submitPdfTranslation : submitTextTranslation;

  const getActionLabel = () => {
    if (mode === "pdf") {
      return pdfResult
        ? fa.translation.retranslatePdf
        : fa.translation.translatePdf;
    }
    return translatedText
      ? fa.translation.retranslate
      : fa.translation.translate;
  };
  const actionLabel = getActionLabel();

  const getErrorMessage = () => {
    if (pdfError) return pdfError;
    if (clipboardError) return clipboardError;
    if (modelsError) return fa.general.modelsRefreshFailed;
    if (translatePdfMutation.error) {
      return extractErrorMessage(
        translatePdfMutation.error,
        fa.translation.error
      );
    }
    return extractErrorMessage(translateMutation.error, fa.translation.error);
  };

  const hasError =
    translateMutation.error ||
    translatePdfMutation.error ||
    modelsError ||
    clipboardError ||
    pdfError;

  return (
    <ToolScaffold
      alerts={
        hasError && (
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <span>{getErrorMessage()}</span>
              <span>{fa.translation.tryAgain}</span>
            </div>
          </Alert>
        )
      }
      content={
        <div className="flex flex-col gap-6">
          <ToolPageHeader
            description={fa.index.translationDescription}
            title={fa.index.translationTitle}
          />

          <TranslationSettings
            isModelsLoading={isModelsLoading}
            isTranslating={isTranslating}
            modelId={modelId}
            models={models}
            onModelChange={setModelId}
            onSourceLanguageChange={setSourceLanguage}
            onSwapLanguages={swapLanguages}
            onTargetLanguageChange={setTargetLanguage}
            onToneChange={setTone}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            tone={tone}
          />

          <div className="flex justify-start">
            <Button
              className={PRIMARY_ACTION_CLASS}
              disabled={actionDisabled}
              onClick={actionHandler}
              type="button"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{fa.translation.translating}</span>
                </>
              ) : (
                <>
                  <span className="text-sm">{actionLabel}</span>
                  <SendIcon className="size-4" />
                </>
              )}
            </Button>
          </div>

          <Tabs
            className="flex w-full flex-col"
            onValueChange={(value) => setMode(value as "text" | "pdf")}
            value={mode}
          >
            <TabsContent
              className="focus-visible:outline-none focus-visible:ring-0"
              value="text"
            >
              <ToolGrid>
                <TranslationTextInput
                  isTranslating={isTranslating}
                  onKeyDown={handleSourceKeyDown}
                  onTextChange={setSourceText}
                  sourceText={sourceText}
                />
                <TranslationResult
                  isCopied={isCopied}
                  isTranslating={isTranslatingText}
                  onCopy={handleCopy}
                  translatedText={translatedText}
                />
              </ToolGrid>
            </TabsContent>

            <TabsContent
              className="focus-visible:outline-none focus-visible:ring-0"
              value="pdf"
            >
              <ToolGrid>
                <ToolPanel title={fa.translation.sourceLanguage}>
                  <PdfUploadArea
                    isDragging={isDragging}
                    isTranslating={isTranslating}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onFileSelect={handlePdfSelect}
                    onKeyDown={handleKeyDown}
                    onRemovePdf={handleRemovePdf}
                    pdfFileName={pdfFileName}
                    pdfResult={pdfResult}
                    selectedPdf={selectedPdf}
                  />
                </ToolPanel>

                <ToolPanel
                  actions={
                    translatedText ? (
                      <Button
                        className={
                          isCopied ? "bg-green-600 hover:bg-green-700" : ""
                        }
                        onClick={handleCopy}
                        size="sm"
                        type="button"
                        variant={isCopied ? "default" : "ghost"}
                      >
                        <Copy className="h-4 w-4" />
                        {isCopied ? fa.summarize.copied : fa.summarize.copy}
                      </Button>
                    ) : null
                  }
                  title={fa.translation.translatedText}
                >
                  <PdfResultDisplay
                    isCopied={isCopied}
                    isTranslating={isTranslatingPdf}
                    onCopy={handleCopy}
                    pdfResult={pdfResult}
                    translatedText={translatedText}
                  />
                </ToolPanel>
              </ToolGrid>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
