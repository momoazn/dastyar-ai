import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  ArrowLeftRightIcon,
  Copy,
  FileIcon,
  FileText,
  Loader2,
  SendIcon,
  Upload,
  X,
} from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  Alert,
  Badge,
  Button,
  Card,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslationModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { createLanguageOptions, createToneOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import type {
  LanguageCode,
  Tone,
  TranslationPayload,
} from "@/server/database/schema";
import { orpc, queryClient } from "@/utils/orpc";

// Precompute selection option lists to avoid repeated work during renders
const languageOptions = createLanguageOptions();
const toneOptions = createToneOptions();

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI composition with conditional rendering and state management
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
    if (mode === "pdf") {
      return;
    }
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setClipboardError(null);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setClipboardError("Failed to copy to clipboard");
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
    if (modelsError) return "Failed to load models. Please refresh the page.";
    if (translatePdfMutation.error) {
      return translatePdfMutation.error.message;
    }
    return translateMutation.error?.message;
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
        <div className="flex h-full flex-col gap-6">
          {/* Title Header */}
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl">{fa.index.translationTitle}</h1>
          </div>

          {/* Options Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.sourceLanguage}
              </div>
              <Select
                disabled={isTranslating}
                onValueChange={(v) => setSourceLanguage(v as LanguageCode)}
                value={sourceLanguage}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {languageOptions.map((lang) => (
                    <SelectItem
                      className="text-right"
                      key={lang.value}
                      value={lang.value}
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.targetLanguage}
              </div>
              <Select
                disabled={isTranslating}
                onValueChange={(v) => setTargetLanguage(v as LanguageCode)}
                value={targetLanguage}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {languageOptions.map((lang) => (
                    <SelectItem
                      className="text-right"
                      key={lang.value}
                      value={lang.value}
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.translationTone}
              </div>
              <Select
                disabled={isTranslating}
                onValueChange={(v) => setTone(v as Tone)}
                value={tone}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {toneOptions.map((t) => (
                    <SelectItem
                      className="text-right"
                      key={t.value}
                      value={t.value}
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{fa.translation.model}</div>
              <Select
                disabled={isTranslating || isModelsLoading}
                onValueChange={(value) => setModelId(Number(value))}
                value={modelId?.toString()}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue
                    placeholder={
                      isModelsLoading
                        ? fa.general.loadingModels
                        : fa.general.selectModel
                    }
                  />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {models?.map((m) => (
                    <SelectItem
                      className="text-right"
                      key={m.id}
                      value={m.id.toString()}
                    >
                      {m.identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full gap-2"
                disabled={isTranslating || mode === "pdf"}
                onClick={swapLanguages}
                type="button"
                variant="outline"
              >
                <ArrowLeftRightIcon className="h-4 w-4" />
                <span className="text-sm">
                  {fa.translation.sourceLanguage} ↔{" "}
                  {fa.translation.targetLanguage}
                </span>
              </Button>
            </div>
          </div>

          {/* Main Action Button */}
          <div className="flex justify-end">
            <Button
              className="min-w-[160px] gap-2"
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

          {/* Two Column Layout */}
          <Tabs
            className="flex h-full w-full flex-col"
            onValueChange={(value) => setMode(value as "text" | "pdf")}
            value={mode}
          >
            <TabsContent
              className="flex-1 focus-visible:outline-none focus-visible:ring-0"
              value="text"
            >
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
                      <TabsList className="w-fit">
                        <TabsTrigger value="text">
                          {fa.translation.textTab}
                        </TabsTrigger>
                        <TabsTrigger value="pdf">
                          {fa.translation.pdfTab}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <Textarea
                      aria-label={fa.translation.enterText}
                      className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                      dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
                      disabled={isTranslating}
                      onChange={(e) => setSourceText(e.target.value)}
                      onKeyDown={handleSourceKeyDown}
                      placeholder={fa.translation.enterText}
                      value={sourceText}
                    />
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
                        {translatedText && (
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
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    {isTranslatingText ? (
                      <div className="flex h-full min-h-[300px] items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <div className="text-muted-foreground text-sm">
                            {fa.translation.translating}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Textarea
                        aria-label={fa.translation.translatedText}
                        className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                        dir={
                          translatedText
                            ? detectTextDirection(translatedText)
                            : "rtl"
                        }
                        placeholder={fa.translation.translatedText}
                        readOnly
                        value={translatedText}
                      />
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              className="flex-1 focus-visible:outline-none focus-visible:ring-0"
              value="pdf"
            >
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
                      <TabsList className="w-fit">
                        <TabsTrigger value="text">
                          {fa.translation.textTab}
                        </TabsTrigger>
                        <TabsTrigger value="pdf">
                          {fa.translation.pdfTab}
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    {selectedPdf ? (
                      <div className="flex h-full flex-col gap-4">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                            <FileText className="h-6 w-6 text-destructive" />
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
                            onClick={handleRemovePdf}
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
                              <div>
                                {fa.translation.pdfPageCount(
                                  pdfResult.page_count
                                )}
                              </div>
                              {pdfFileName && (
                                <div>
                                  {fa.translation.pdfSourceFile(pdfFileName)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // biome-ignore lint/a11y/noStaticElementInteractions: Drag handlers require div for drag-and-drop functionality
                      // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Drag handlers require div for drag-and-drop functionality
                      <div
                        className={cn(
                          "flex h-full max-h-[400px] min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                          isDragging
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 bg-muted/30"
                        )}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onKeyDown={handleKeyDown}
                        // biome-ignore lint/a11y/noNoninteractiveTabindex: Drag handlers require div for drag-and-drop functionality
                        tabIndex={0}
                      >
                        <input
                          accept=".pdf"
                          className="hidden"
                          disabled={isTranslating}
                          id="pdf-upload"
                          onChange={handlePdfSelect}
                          type="file"
                        />
                        <label
                          className="flex cursor-pointer flex-col items-center gap-4 p-6 text-center"
                          htmlFor="pdf-upload"
                        >
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                              isDragging
                                ? "bg-primary/10"
                                : "bg-muted-foreground/10"
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
                                ? "رها کنید برای آپلود"
                                : fa.translation.selectPdf}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {fa.translation.pdfHint}
                            </span>
                          </div>
                          <div className="mt-2 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 font-medium text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                            انتخاب فایل
                          </div>
                        </label>
                      </div>
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
                        {translatedText && (
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
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {isTranslatingPdf ? (
                      <div className="flex h-full max-h-[400px] min-h-[300px] items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <div className="text-muted-foreground text-sm">
                            {fa.translation.translating}
                          </div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        if (pdfResult && translatedText) {
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
                                    ترجمه تکمیل شده
                                  </div>
                                  <div className="text-green-600/80 text-xs">
                                    {pdfResult.page_count} صفحه ترجمه شده
                                  </div>
                                </div>
                              </div>
                              <Textarea
                                aria-label={fa.translation.translatedText}
                                className="min-h-[140px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                                dir={detectTextDirection(translatedText)}
                                readOnly
                                value={translatedText}
                              />
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
                                    ترجمه تکمیل شده
                                  </div>
                                  <div className="text-green-600/80 text-xs">
                                    {pdfResult.page_count} صفحه ترجمه شده
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
                                      <Card
                                        className="p-4"
                                        dir={textDir}
                                        key={page.page}
                                      >
                                        <div className="mb-3 flex items-center gap-2">
                                          <Badge
                                            className="text-xs"
                                            variant="secondary"
                                          >
                                            {fa.translation.pdfPageLabel(
                                              page.page
                                            )}
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
                        return (
                          <div className="flex h-full max-h-[400px] min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/30">
                            <div className="flex flex-col items-center gap-4 p-6 text-center">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="font-medium text-sm">
                                  برای مشاهده نتیجه، فایل PDF را انتخاب و ترجمه
                                  کنید
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  فایل PDF خود را انتخاب کنید تا ترجمه شروع شود
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
