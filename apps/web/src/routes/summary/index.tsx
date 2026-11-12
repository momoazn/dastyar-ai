import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Copy, Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  EmptyHint,
  ModelSelect,
  PRIMARY_ACTION_CLASS,
  SettingField,
  ToolGrid,
  ToolPageHeader,
  ToolPanel,
  ToolSettings,
} from "@/components/tool-page/tool-page";
import {
  Alert,
  Button,
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
import { getErrorMessage as extractErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { detectTextDirection } from "@/lib/utils";
import type { SummaryMode, Tone } from "@/server/database/schema";
import { orpc, queryClient } from "@/utils/orpc";

const COPY_SUCCESS_DURATION_MS = 2000;

// Precompute selection option lists to avoid repeated work during renders
const summaryModeOptions = createSummaryModeOptions();
const toneOptions = createToneOptions();

// Search params shape for this route
type SummarizeSearch = { fromId?: number | string };

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

export const Route = createFileRoute("/summary/")({
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
  const search = useSearch({ from: "/summary/" }) as SummarizeSearch;

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

  const summaryId = parseSummaryId(search.fromId);
  const hasSummaryId = summaryId > 0;

  // Load summary if fromId is provided in URL (for copying)
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
        setSummaryText(data.summaryText || "");
        // Stay on the same page to allow quick iterations
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
      setClipboardError(fa.general.clipboardCopyFailed);
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
                    ? fa.general.modelsRefreshFailed
                    : extractErrorMessage(
                        summarizeMutation.error,
                        fa.summarize.errors.requestFailed
                      ));
                return <span>{message}</span>;
              })()}
              <span>{fa.translation.tryAgain}</span>
            </div>
          </Alert>
        )
      }
      content={
        <div className="flex flex-col gap-6">
          <ToolPageHeader
            description={fa.summarize.description}
            title={fa.summarize.title}
          />

          <ToolSettings title={fa.summarize.settingsTitle}>
            <SettingField label={fa.summarize.modeLabel}>
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
            </SettingField>
            <SettingField label={fa.summarize.toneLabel}>
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
            </SettingField>
            <ModelSelect
              disabled={summarizeMutation.isPending}
              isLoading={isModelsLoading}
              label={fa.summarize.model}
              modelId={modelId}
              models={models}
              onChange={setModelId}
            />
          </ToolSettings>

          <div className="flex justify-start">
            <Button
              className={PRIMARY_ACTION_CLASS}
              disabled={!canSummarize}
              onClick={submitSummarize}
              type="button"
            >
              {summarizeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{fa.summarize.generating}</span>
                </>
              ) : (
                <span className="text-sm">{fa.summarize.generate}</span>
              )}
            </Button>
          </div>

          <ToolGrid>
            <ToolPanel title={fa.summarize.sourceText}>
              <Textarea
                aria-label={fa.summarize.sourceText}
                className="min-h-[300px] flex-1 resize-none border-none bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
                dir={sourceText ? detectTextDirection(sourceText) : "rtl"}
                disabled={summarizeMutation.isPending}
                onChange={(e) => setSourceText(e.target.value)}
                onKeyDown={handleSourceKeyDown}
                placeholder={fa.summarize.enterText}
                value={sourceText}
              />
            </ToolPanel>

            <ToolPanel
              actions={
                summaryText ? (
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
              title={fa.summarize.generatedText}
            >
              {summarizeMutation.isPending ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-muted-foreground text-sm">
                    {fa.summarize.generating}
                  </div>
                </div>
              ) : null}
              {!summarizeMutation.isPending && summaryText ? (
                <div
                  className="wrap-break-word whitespace-pre-wrap text-base"
                  dir={detectTextDirection(summaryText)}
                >
                  {summaryText}
                </div>
              ) : null}
              {summarizeMutation.isPending || summaryText ? null : (
                <EmptyHint>{fa.summarize.summaryPlaceholder}</EmptyHint>
              )}
            </ToolPanel>
          </ToolGrid>
        </div>
      }
    />
  );
}
