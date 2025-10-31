import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy } from "lucide-react";
import { useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { Alert, Badge, Button, Card, Textarea } from "@/components/ui";
import { useSummarizeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import {
  createSummaryModeOptions,
  createToneOptions,
} from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

// Precompute selection option lists
const summaryModeOptions = createSummaryModeOptions();
const toneOptions = createToneOptions();

export const Route = createFileRoute("/summary/$summaryId")({
  component: () => (
    <ProtectedLayout>
      <SummaryHistoryView />
    </ProtectedLayout>
  ),
});

function SummaryHistoryView() {
  const { summaryId: id } = Route.useParams();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);

  const summaryId = Number.parseInt(id, 10);

  const { data: summaryData, isLoading } = useQuery(
    orpc.summarize.get.queryOptions({
      input: { id: summaryId },
    })
  );

  const { models } = useSummarizeModelSelection();

  // Helper functions to get labels
  const getModeLabel = (mode: string) =>
    summaryModeOptions.find((m) => m.value === mode)?.label ?? mode;

  const getToneLabel = (tone: string) =>
    toneOptions.find((t) => t.value === tone)?.label ?? tone;

  const getModelName = (modelId: number) =>
    models?.find((m) => m.id === modelId)?.identifier ?? `Model #${modelId}`;

  const handleCopyToNew = () => {
    navigate({
      to: "/summary/",
      search: { fromId: summaryId },
    });
  };

  const handleCopyText = async () => {
    if (!summaryData?.summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryData.summaryText);
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

  if (!summaryData) {
    return (
      <ToolScaffold
        alerts={
          <Alert variant="destructive">
            <span>Summary not found</span>
          </Alert>
        }
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Summary not found</div>
          </div>
        }
      />
    );
  }

  return (
    <ToolScaffold
      content={
        <div className="flex h-full flex-col gap-6">
          {/* Title Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-2xl">
                {fa.summarize.title} - {fa.general.history}
              </h1>
              <Button
                className="gap-2"
                onClick={handleCopyToNew}
                type="button"
                variant="outline"
              >
                <span className="text-sm">کپی به جدید</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.summarize.modeLabel}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getModeLabel(summaryData.mode as string)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.translation.translationTone}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getToneLabel(summaryData.tone as string)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{fa.summarize.model}</div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getModelName(summaryData.modelId as number)}
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
                    {fa.summarize.sourceText}
                  </span>
                  <Badge variant="secondary">فقط خواندنی</Badge>
                </div>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                  dir={
                    summaryData.sourceText
                      ? detectTextDirection(summaryData.sourceText)
                      : "rtl"
                  }
                  readOnly
                  value={summaryData.sourceText ?? ""}
                />
              </div>
            </Card>

            {/* Result Column (Left) */}
            <Card className="flex flex-col py-0 lg:order-2">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {fa.summarize.generatedText}
                  </span>
                  <div className="flex items-center gap-2">
                    {summaryData.summaryText && (
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
              <div className="flex-1 p-4">
                <Textarea
                  className="h-full min-h-[300px] resize-none border-none p-0 text-base shadow-none focus-visible:ring-0"
                  dir={
                    summaryData.summaryText
                      ? detectTextDirection(summaryData.summaryText)
                      : "rtl"
                  }
                  readOnly
                  value={summaryData.summaryText ?? ""}
                />
              </div>
            </Card>
          </div>
        </div>
      }
    />
  );
}
