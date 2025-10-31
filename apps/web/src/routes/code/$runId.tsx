import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bug, Code, Copy, FileText, Shield } from "lucide-react";
import { useState } from "react";
import { Response } from "@/components/ai-elements/response";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { Alert, Badge, Button, Card, Textarea } from "@/components/ui";
import { useCodeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/code/$runId")({
  component: () => (
    <ProtectedLayout>
      <CodeHistoryView />
    </ProtectedLayout>
  ),
});

const modeIcons = {
  generate: Code,
  explain: FileText,
  review: Shield,
  debug: Bug,
};

function CodeHistoryView() {
  const { runId: id } = Route.useParams();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);

  const runId = Number.parseInt(id, 10);

  const { data: runData, isLoading } = useQuery(
    orpc.code.getRun.queryOptions({
      input: { id: runId },
    })
  );

  const { models } = useCodeModelSelection();

  // Helper function to get model name
  const getModelName = (modelId: number) =>
    models?.find((m) => m.id === modelId)?.name ?? `Model #${modelId}`;

  const handleCopyToNew = () => {
    navigate({
      to: "/code/",
      search: { fromId: runId },
    });
  };

  const handleCopyOutput = async () => {
    if (!formattedOutput) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
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

  if (!runData) {
    return (
      <ToolScaffold
        alerts={
          <Alert variant="destructive">
            <span>Code run not found</span>
          </Alert>
        }
        content={
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Code run not found</div>
          </div>
        }
      />
    );
  }

  const mode = runData.mode as string;
  const language = runData.language as string;
  const ModeIcon = modeIcons[mode as keyof typeof modeIcons] ?? Code;

  // Format output based on mode
  const formatOutput = (): string => {
    try {
      const parsed = JSON.parse(runData.output as string) as unknown;
      if (mode === "generate") {
        return (parsed as { generatedCode?: string }).generatedCode || "";
      }
      if (mode === "explain") {
        return (parsed as { explanation?: string }).explanation || "";
      }
      if (mode === "review") {
        const r = parsed as { feedback?: string; suggestions?: string[] };
        const suggestions = (r.suggestions ?? [])
          .map((s) => `- ${s}`)
          .join("\n");
        return `${r.feedback ?? ""}${
          suggestions
            ? `\n\n${fa.codeAssistant.review.suggestions}:\n${suggestions}`
            : ""
        }`;
      }
      if (mode === "debug") {
        const d = parsed as {
          rootCause?: string;
          solution?: string;
          codeFix?: string;
        };
        return `${fa.codeAssistant.debug.rootCause}: ${d.rootCause ?? ""}\n\n${
          fa.codeAssistant.debug.solution
        }: ${d.solution ?? ""}${
          d.codeFix
            ? `\n\n${fa.codeAssistant.debug.fixedCode}:\n${d.codeFix}`
            : ""
        }`;
      }
      return runData.output as string;
    } catch {
      return runData.output as string;
    }
  };

  const formattedOutput = formatOutput();

  return (
    <ToolScaffold
      content={
        <div className="flex h-full flex-col gap-6">
          {/* Title Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-2xl">
                دستیار کد - {fa.general.history}
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

          {/* Code Run Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.codeAssistant.labels.mode}
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-right text-sm">
                <ModeIcon className="h-4 w-4" />
                {fa.codeAssistant.modes[
                  mode as keyof typeof fa.codeAssistant.modes
                ] ?? mode}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.codeAssistant.labels.language}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {language}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">
                {fa.codeAssistant.labels.model}
              </div>
              <div className="rounded-md border bg-muted px-3 py-2 text-right text-sm">
                {getModelName(runData.modelId as number)}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div
            className="grid h-full w-full grid-cols-1 gap-4 lg:grid-cols-2"
            dir="rtl"
          >
            {/* Input Column (Right) */}
            <Card className="flex flex-col py-0 lg:order-1">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {mode === "generate"
                      ? fa.codeAssistant.labels.codeRequest
                      : fa.codeAssistant.labels.inputCode}
                  </span>
                  <Badge variant="secondary">فقط خواندنی</Badge>
                </div>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={cn(
                    "h-full max-h-[400px] min-h-[200px] resize-none border-none p-0 font-mono text-sm shadow-none focus-visible:ring-0",
                    (runData.inputText
                      ? detectTextDirection(runData.inputText)
                      : "ltr") === "rtl"
                      ? "text-right"
                      : "text-left"
                  )}
                  dir={
                    runData.inputText
                      ? detectTextDirection(runData.inputText)
                      : "ltr"
                  }
                  readOnly
                  spellCheck={false}
                  value={runData.inputText ?? ""}
                />
              </div>
            </Card>

            {/* Output Column (Left) */}
            <Card className="flex flex-col py-0 lg:order-2">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {fa.codeAssistant.labels.result}
                  </span>
                  <div className="flex items-center gap-2">
                    {formattedOutput && (
                      <Button
                        className={
                          isCopied ? "bg-green-600 hover:bg-green-700" : ""
                        }
                        onClick={handleCopyOutput}
                        size="sm"
                        type="button"
                        variant={isCopied ? "default" : "ghost"}
                      >
                        <Copy className="h-4 w-4" />
                        {isCopied ? "کپی شد" : "کپی"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <div
                  className="h-full max-h-[400px] min-h-[200px] overflow-auto text-left"
                  dir="ltr"
                >
                  <Response>
                    {mode === "generate" && formattedOutput
                      ? `\`\`\`${language}\n${formattedOutput}\n\`\`\``
                      : formattedOutput}
                  </Response>
                </div>
              </div>
            </Card>
          </div>

          {/* Error Input (for debug mode) */}
          {mode === "debug" && runData.errorText && (
            <Card className="p-4">
              <div className="mb-2">
                <h3 className="font-medium">
                  {fa.codeAssistant.labels.errorMessage}
                </h3>
              </div>
              <Textarea
                autoCapitalize="off"
                autoCorrect="off"
                className={cn(
                  "min-h-[100px] resize-none font-mono text-sm",
                  (runData.errorText
                    ? detectTextDirection(runData.errorText)
                    : "ltr") === "rtl"
                    ? "text-right"
                    : "text-left"
                )}
                dir={
                  runData.errorText
                    ? detectTextDirection(runData.errorText)
                    : "ltr"
                }
                readOnly
                spellCheck={false}
                value={runData.errorText}
              />
            </Card>
          )}
        </div>
      }
    />
  );
}
