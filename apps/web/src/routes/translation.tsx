import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowLeftRightIcon,
  ClipboardIcon,
  SendIcon,
  TriangleAlert,
} from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { ToolbarRow } from "@/components/scaffold/toolbar-row";
import { TranscribeButton } from "@/components/transcribe-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Input,
  Label,
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
  const [transcribeModel, setTranscribeModel] = useState("");
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Infer transcribe language from source language
  const transcribeLanguage = sourceLanguage === "fa" ? "fa" : "en";

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
    } catch {
      setClipboardError("Failed to copy to clipboard");
    }
  };

  const handlePdfSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      setPdfError(fa.translation.pdfInvalidFile);
      setSelectedPdf(null);
      setPdfResult(null);
      setPdfFileName("");
      event.target.value = "";
      return;
    }
    setPdfError(null);
    setMode("pdf");
    setSelectedPdf(file);
    setPdfFileName(file.name);
    setPdfResult(null);
    setTranslatedText("");
    event.target.value = "";
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
  const actionLabel =
    mode === "pdf"
      ? pdfResult
        ? fa.translation.retranslatePdf
        : fa.translation.translatePdf
      : translatedText
        ? fa.translation.retranslate
        : fa.translation.translate;

  return (
    <ToolScaffold
      alerts={
        (translateMutation.error ||
          translatePdfMutation.error ||
          modelsError ||
          clipboardError ||
          transcribeError ||
          pdfError) && (
          <Alert className="mb-3" dir="rtl" role="alert" variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>{fa.translation.errorTitle}</AlertTitle>
            <AlertDescription>
              {(() => {
                if (pdfError) return pdfError;
                if (clipboardError) return clipboardError;
                if (transcribeError) return transcribeError;
                if (modelsError)
                  return "Failed to load models. Please refresh the page.";
                if (translatePdfMutation.error) {
                  return translatePdfMutation.error.message;
                }
                return translateMutation.error?.message;
              })()}
            </AlertDescription>
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
            <div className="mt-4 flex h-full w-full flex-col gap-4">
              <Card aria-live="polite" className="flex-2/5 p-4">
                <div className="flex h-full flex-col">
                  <div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
                    <span>{fa.translation.charCount(sourceCharCount)}</span>
                    <div className="flex items-center gap-2">
                      <TranscribeButton
                        disabled={isTranslating}
                        language={transcribeLanguage}
                        model={transcribeModel}
                        onError={(error) => {
                          setTranscribeError(
                            typeof error === "string"
                              ? error
                              : "Transcription failed"
                          );
                        }}
                        onModelChange={setTranscribeModel}
                        onTranscribed={(text) => setSourceText(text)}
                        showControls={true}
                        size="icon"
                        variant="ghost"
                      />
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {transcribeLanguage === "fa"
                          ? fa.translation.transcribeLanguagePersian
                          : fa.translation.transcribeLanguageEnglish}
                      </span>
                      <span>
                        {sourceText.trim() ? fa.translation.keyboardHint : ""}
                      </span>
                    </div>
                  </div>
                  <Textarea
                    aria-label={fa.translation.enterText}
                    className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
                    dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
                    onChange={(e) => setSourceText(e.target.value)}
                    onKeyDown={handleSourceKeyDown}
                    placeholder={fa.translation.enterText}
                    value={sourceText}
                  />
                </div>
              </Card>
              <Card className="flex-2/5 p-4">
                <div className="flex h-full flex-col">
                  {isTranslatingText ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-muted-foreground">
                        {fa.translation.translating}...
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
                        <span>{fa.translation.translatedText}</span>
                        <Button
                          aria-label={fa.translation.copyTranslation}
                          className="h-6 px-2"
                          disabled={
                            !(pdfResult && translatedText) || isTranslating
                          }
                          onClick={handleCopy}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <ClipboardIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        aria-label={fa.translation.translatedText}
                        className="min-h-[200px] flex-1 resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
                        dir={
                          translatedText
                            ? detectTextDirection(translatedText)
                            : "rtl"
                        }
                        placeholder={fa.translation.translatedText}
                        readOnly
                        value={translatedText}
                      />
                    </>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
          <TabsContent
            className="flex-1 focus-visible:outline-none focus-visible:ring-0"
            value="pdf"
          >
            <div className="mt-4 flex h-full w-full flex-col gap-4">
              <Card className="flex-2/5 p-4">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="font-medium text-sm" htmlFor="pdf-upload">
                      {fa.translation.selectPdf}
                    </Label>
                    <Input
                      accept=".pdf"
                      disabled={isTranslating}
                      id="pdf-upload"
                      onChange={handlePdfSelect}
                      type="file"
                    />
                    <span className="text-muted-foreground text-xs">
                      {fa.translation.pdfHint}
                    </span>
                    {selectedPdf && (
                      <span className="text-muted-foreground text-sm">
                        {fa.translation.pdfSelected(selectedPdf.name)}
                      </span>
                    )}
                  </div>
                  {pdfResult && (
                    <div className="rounded border border-dashed p-3 text-muted-foreground text-xs leading-relaxed">
                      <div>{fa.translation.pdfSummaryHeader}</div>
                      <div className="mt-1">
                        {fa.translation.pdfPageCount(pdfResult.pageCount)}
                      </div>
                      {pdfFileName && (
                        <div className="mt-1">
                          {fa.translation.pdfSourceFile(pdfFileName)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
              <Card className="flex-2/5 p-4">
                <div className="flex h-full flex-col">
                  {isTranslatingPdf ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-muted-foreground">
                        {fa.translation.translating}...
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between text-muted-foreground text-xs">
                        <span>{fa.translation.translatedText}</span>
                        <Button
                          aria-label={fa.translation.copyTranslation}
                          className="h-6 px-2"
                          disabled={!translatedText || isTranslating}
                          onClick={handleCopy}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <ClipboardIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea
                        aria-label={fa.translation.translatedText}
                        className="min-h-[140px] resize-none border-none p-2 text-base shadow-none focus-visible:ring-0"
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
                        <ScrollArea className="mt-4 flex-1 pr-2">
                          <div className="flex flex-col gap-3">
                            {pdfResult.pages.map((page) => (
                              <div
                                className="rounded border p-3"
                                key={page.page}
                              >
                                <div className="mb-1 font-medium text-muted-foreground text-xs">
                                  {fa.translation.pdfPageLabel(page.page)}
                                </div>
                                <p
                                  className="whitespace-pre-wrap text-sm leading-relaxed"
                                  dir={detectTextDirection(page.translatedText)}
                                >
                                  {page.translatedText}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-1 items-center justify-center text-muted-foreground text-xs">
                          {fa.translation.pdfAwaitingUpload}
                        </div>
                      )}
                    </>
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
              className="min-w-[160px]"
              disabled={actionDisabled}
              onClick={actionHandler}
              type="button"
            >
              <span className="text-sm">{actionLabel}</span>
              <SendIcon className="size-4" />
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
          <div>
            <Button
              disabled={isTranslating || mode === "pdf"}
              onClick={swapLanguages}
              type="button"
              variant="outline"
            >
              <ArrowLeftRightIcon className="mr-2 h-4 w-4" />
              {fa.translation.sourceLanguage} ↔ {fa.translation.targetLanguage}
            </Button>
          </div>
        </ToolbarRow>
      }
    />
  );
}
