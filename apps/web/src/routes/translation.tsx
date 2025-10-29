import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowLeftRightIcon,
  ClipboardIcon,
  FileIcon,
  FileText,
  Loader2,
  SendIcon,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { ToolbarRow } from "@/components/scaffold/toolbar-row";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslationModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { createLanguageOptions, createToneOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
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
type TranslationSearch = { id?: number | string };

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

export const Route = createFileRoute("/translation")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI composition with conditional rendering and state management
function RouteComponent() {
  const search = useSearch({ from: "/translation" }) as TranslationSearch;
  const navigate = useNavigate();
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

  const {
    modelId,
    setModelId,
    models,
    isLoading: isModelsLoading,
    error: modelsError,
  } = useTranslationModelSelection();

  const translationId = parseTranslationId(search.id);
  const hasTranslationId = translationId > 0;

  // Load translation if ID is provided in URL
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
        // Update URL to reflect the new translation
        navigate({
          to: "/translation",
          search: { id: data.id },
        });
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
        setMode("pdf");
        setTranslatedText(data.translatedText ?? "");
        setPdfResult((data.payload as TranslationPayload) ?? null);
        setPdfFileName(data.sourceFileName ?? selectedPdf?.name ?? "");
        setSelectedPdf(null);
        navigate({
          to: "/translation",
          search: { id: data.id },
        });
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
      toast.success("ترجمه با موفقیت کپی شد");
    } catch {
      setClipboardError("Failed to copy to clipboard");
      toast.error("خطا در کپی کردن ترجمه");
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
  const sourceCharCount = sourceText.length;
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
          <Alert className="mb-3" dir="rtl" role="alert" variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>{fa.translation.errorTitle}</AlertTitle>
            <AlertDescription>{getErrorMessage()}</AlertDescription>
          </Alert>
        )
      }
      content={
        <Tabs
          className="flex h-full w-full flex-col"
          onValueChange={(value) => setMode(value as "text" | "pdf")}
          value={mode}
        >
          <TabsList className="w-fit">
            <TabsTrigger value="text">{fa.translation.textTab}</TabsTrigger>
            <TabsTrigger value="pdf">{fa.translation.pdfTab}</TabsTrigger>
          </TabsList>
          <TabsContent
            className="flex-1 focus-visible:outline-none focus-visible:ring-0"
            value="text"
          >
            <div className="mt-4 grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="flex flex-col">
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs" variant="secondary">
                      {fa.translation.translatedText}
                    </Badge>
                    <Button
                      aria-label={fa.translation.copyTranslation}
                      className="h-6 gap-1.5 px-2"
                      disabled={!translatedText || isTranslating}
                      onClick={handleCopy}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ClipboardIcon className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {fa.translation.copyTranslation}
                      </span>
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex-1 p-4">
                  {isTranslatingText ? (
                    <div className="flex h-full items-center justify-center">
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
                      className="h-full min-h-[300px] resize-none border-none p-3 text-base shadow-none focus-visible:ring-0"
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
              <Card aria-live="polite" className="flex flex-col">
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs" variant="secondary">
                      {fa.translation.sourceLanguage}
                    </Badge>
                    <div className="flex h-6 items-center px-2">
                      <span className="text-muted-foreground text-xs">
                        {fa.translation.charCount(sourceCharCount)}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex-1 p-4">
                  <Textarea
                    aria-label={fa.translation.enterText}
                    className="h-full min-h-[300px] resize-none border-none p-3 text-base shadow-none focus-visible:ring-0"
                    dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
                    onChange={(e) => setSourceText(e.target.value)}
                    onKeyDown={handleSourceKeyDown}
                    placeholder={fa.translation.enterText}
                    value={sourceText}
                  />
                </div>
              </Card>
            </div>
          </TabsContent>
          <TabsContent
            className="flex-1 focus-visible:outline-none focus-visible:ring-0"
            value="pdf"
          >
            <div className="mt-4 grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="flex flex-col">
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs" variant="secondary">
                      {fa.translation.translatedText}
                    </Badge>
                    <Button
                      aria-label={fa.translation.copyTranslation}
                      className="h-6 gap-1.5 px-2"
                      disabled={!translatedText || isTranslating}
                      onClick={handleCopy}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <ClipboardIcon className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {fa.translation.copyTranslation}
                      </span>
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-1 flex-col gap-4 p-4">
                  {isTranslatingPdf ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-muted-foreground text-sm">
                          {fa.translation.translating}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        aria-label={fa.translation.translatedText}
                        className="min-h-[140px] resize-none border-none p-3 text-base shadow-none focus-visible:ring-0"
                        dir={
                          pdfResult && translatedText
                            ? detectTextDirection(translatedText)
                            : "rtl"
                        }
                        placeholder={fa.translation.translatedText}
                        readOnly
                        value={pdfResult ? translatedText : ""}
                      />
                      {pdfResult && pdfResult.pages.length > 0 ? (
                        <ScrollArea className="flex-1 pr-2">
                          <div className="flex flex-col gap-3">
                            {pdfResult.pages.map((page) => (
                              <Card className="p-4" key={page.page}>
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge className="text-xs" variant="outline">
                                    {fa.translation.pdfPageLabel(page.page)}
                                  </Badge>
                                </div>
                                <p
                                  className="whitespace-pre-wrap text-sm leading-relaxed"
                                  dir={detectTextDirection(page.translatedText)}
                                >
                                  {page.translatedText}
                                </p>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground text-sm">
                              {fa.translation.pdfAwaitingUpload}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
              <Card className="flex flex-col">
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between">
                    <Badge className="text-xs" variant="secondary">
                      {fa.translation.sourceLanguage}
                    </Badge>
                  </div>
                </div>
                <Separator />
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
                              {fa.translation.pdfPageCount(pdfResult.pageCount)}
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
                    <div
                      className={`flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 bg-muted/30"
                      }`}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      role="button"
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
                        className="flex cursor-pointer flex-col items-center gap-3 p-6 text-center"
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
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">
                            {isDragging
                              ? "رها کنید برای آپلود"
                              : fa.translation.selectPdf}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {fa.translation.pdfHint}
                          </span>
                        </div>
                        <Button
                          className="mt-2"
                          disabled={isTranslating}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          انتخاب فایل
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      }
      toolbar={
        <ToolbarRow
          action={
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
          }
          columns={4}
        >
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
                    {m.name}
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
        </ToolbarRow>
      }
    />
  );
}
