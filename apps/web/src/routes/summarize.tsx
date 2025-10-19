import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Clipboard, Copy, Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  Alert,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useSummarizeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import {
  createSummaryModeOptions,
  createToneOptions,
} from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { SummaryMode, Tone } from "@/server/database/schema";
import { orpc, queryClient } from "@/utils/orpc";

const COPY_SUCCESS_DURATION_MS = 2000;

// Precompute selection option lists to avoid repeated work during renders
const summaryModeOptions = createSummaryModeOptions();
const toneOptions = createToneOptions();

// Search params shape for this route
type SummarizeSearch = { id?: number | string };

/**
 * Normalize and validate summary id from search (accepts number or string).
 * Returns 0 when id is not a valid positive integer.
 */
function parseSummaryId(value: number | string | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  return 0;
}

/** Determine whether the pressed keys indicate a submit shortcut (Cmd/Ctrl+Enter). */
function isSubmitShortcut(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && e.key === "Enter";
}

export const Route = createFileRoute("/summarize")({
  component: () => (
    <ProtectedLayout>
      <SummarizePage />
    </ProtectedLayout>
  ),
});

/**
 * Summarization page
 *
 * Renders a two-pane UI where users can paste text and generate a summarized
 * version using a selected model, summary mode, and tone configuration.
 *
 * The component maintains URL search state for a given summary `id` to load
 * and display previously generated results.
 */
function SummarizePage() {
  const search = useSearch({ from: "/summarize" }) as SummarizeSearch;
  const navigate = useNavigate();

  // Form state
  const [sourceText, setSourceText] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [mode, setMode] = useState<SummaryMode>("standard");
  const [tone, setTone] = useState<Tone>("formal");
  const [isCopied, setIsCopied] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const {
    modelId,
    setModelId,
    models,
    isLoading: isModelsLoading,
    error: modelsError,
  } = useSummarizeModelSelection();

  const summaryId = parseSummaryId(search.id);
  const hasSummaryId = summaryId > 0;

  // Load summary if ID is provided in URL
  const { data: summaryData } = useQuery(
    orpc.summarize.get.queryOptions({
      input: { id: summaryId },
      enabled: hasSummaryId,
    })
  );

  const summarizeMutation = useMutation(
    orpc.summarize.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.summarize.list.queryKey(),
        });
        setSummaryText(data.summaryText ?? "");
        // Update URL to reflect the new summary
        navigate({
          to: "/summarize",
          search: { id: data.id },
        });
      },
    })
  );

  // Sync local state with server record when a summary is loaded via URL id
  useEffect(() => {
    if (!summaryData) {
      return;
    }
    setSourceText(summaryData.sourceText || "");
    setSummaryText(summaryData.summaryText || "");
    setMode(summaryData.mode as SummaryMode);
    setTone((summaryData.tone as Tone) || "formal");
    if (typeof summaryData.modelId === "number") {
      setModelId(summaryData.modelId);
    }
  }, [summaryData, setModelId]);

  /**
   * Copy the generated summary to clipboard.
   * Shows transient visual confirmation or an inline error alert.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setClipboardError(null);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPY_SUCCESS_DURATION_MS);
    } catch {
      setClipboardError("Failed to copy to clipboard");
    }
  };

  /**
   * Paste clipboard content into the source area.
   */
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardError(null);
      setSourceText(text);
    } catch {
      setClipboardError("Failed to paste from clipboard");
    }
  };

  /**
   * Submit summarization request using current inputs.
   * Centralized to keep mutation calls consistent across triggers.
   */
  const submitSummarize = () => {
    summarizeMutation.mutate({
      text: sourceText,
      mode,
      tone,
      modelId: modelId || 0,
    });
  };

  /**
   * Keyboard shortcut handler for submitting with Cmd/Ctrl + Enter.
   */
  const handleSourceKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSubmitShortcut(e)) {
      e.preventDefault();
      submitSummarize();
    }
  };

  // Derived UI state
  const canSummarize =
    Boolean(sourceText.trim() && modelId && !isModelsLoading) &&
    !summarizeMutation.isPending;
  const sourceCharCount = sourceText.length;

  return (
    <ToolScaffold
      alerts={
        (summarizeMutation.isError || modelsError || clipboardError) && (
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              {(() => {
                const message =
                  clipboardError ??
                  (modelsError
                    ? "Failed to load models. Please refresh the page."
                    : fa.summarize.errors.requestFailed);
                return <span>{message}</span>;
              })()}
              <span>{fa.translation.tryAgain}</span>
            </div>
          </Alert>
        )
      }
      content={
        <>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">{fa.summarize.sourceText}</h3>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {fa.general.charCount(sourceCharCount)}
                </span>
                <Button
                  onClick={handlePaste}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Clipboard className="h-4 w-4" />
                  {fa.summarize.paste}
                </Button>
              </div>
            </div>
            <Textarea
              className="min-h-[200px] resize-none"
              dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
              disabled={summarizeMutation.isPending}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={handleSourceKeyDown}
              placeholder={fa.summarize.enterText}
              value={sourceText}
            />
            <div className="mt-2 text-muted-foreground text-xs">
              {fa.summarize.keyboardHint}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">{fa.summarize.generatedText}</h3>
              {summaryText && (
                <Button
                  className={isCopied ? "bg-green-600 hover:bg-green-700" : ""}
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
            <Textarea
              className="min-h-[200px] resize-none"
              dir={summaryText ? detectTextDirection(summaryText) : "rtl"}
              placeholder={fa.summarize.summaryPlaceholder}
              readOnly
              value={summaryText}
            />
          </Card>
        </>
      }
      toolbar={
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.summarize.modeLabel}
              </div>
              <Select
                disabled={summarizeMutation.isPending}
                onValueChange={(v) => setMode(v as SummaryMode)}
                value={mode}
              >
                <SelectTrigger className="w-full text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {summaryModeOptions.map((m) => (
                    <SelectItem
                      className="text-right"
                      key={m.value}
                      value={m.value}
                    >
                      {m.label}
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
                disabled={summarizeMutation.isPending}
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
              <div className="font-medium text-sm">{fa.summarize.model}</div>
              <Select
                disabled={summarizeMutation.isPending || isModelsLoading}
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
                  {models?.map((model) => (
                    <SelectItem
                      className="text-right"
                      key={model.id}
                      value={model.id.toString()}
                    >
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              className="min-w-[140px]"
              disabled={!canSummarize}
              onClick={submitSummarize}
              type="button"
            >
              {summarizeMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  {fa.summarize.generating}
                </>
              ) : (
                fa.summarize.generate
              )}
            </Button>
          </div>
        </>
      }
    />
  );
}
