import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  Bug,
  Code,
  FileText,
  Loader2,
  Play,
  Shield,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Response } from "@/components/ai-elements/response";
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
import { useCodeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/code")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

type CodeMode = "generate" | "explain" | "review" | "debug";
type ProgrammingLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust";

const modes: Array<{
  value: CodeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "generate", label: fa.codeAssistant.modes.generate, icon: Code },
  { value: "explain", label: fa.codeAssistant.modes.explain, icon: FileText },
  { value: "review", label: fa.codeAssistant.modes.review, icon: Shield },
  { value: "debug", label: fa.codeAssistant.modes.debug, icon: Bug },
];

const languages: Array<{ value: ProgrammingLanguage; label: string }> = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI composition with conditional blocks
function RouteComponent() {
  const search = useSearch({ from: "/code" }) as { runId?: string };
  const [mode, setMode] = useState<CodeMode>("generate");
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript");
  const [inputCode, setInputCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [output, setOutput] = useState("");

  const {
    modelId,
    setModelId,
    models: modelList,
    isLoading: modelsLoading,
    error: modelsError,
  } = useCodeModelSelection();

  const runMutation = useMutation(
    orpc.code.run.mutationOptions({
      onSuccess: (data, vars) => {
        switch (vars.mode) {
          case "generate":
            setOutput((data as { generatedCode?: string }).generatedCode ?? "");
            break;
          case "explain":
            setOutput((data as { explanation?: string }).explanation ?? "");
            break;
          case "review": {
            const r = data as { feedback?: string; suggestions?: string[] };
            const suggestions = (r.suggestions ?? [])
              .map((s) => `- ${s}`)
              .join("\n");
            setOutput(
              `${r.feedback ?? ""}${
                suggestions
                  ? `\n\n${fa.codeAssistant.review.suggestions}:\n${suggestions}`
                  : ""
              }`
            );
            break;
          }
          case "debug": {
            const d = data as {
              rootCause?: string;
              solution?: string;
              codeFix?: string;
            };
            setOutput(
              `${fa.codeAssistant.debug.rootCause}: ${d.rootCause ?? ""}\n\n${
                fa.codeAssistant.debug.solution
              }: ${d.solution ?? ""}${
                d.codeFix
                  ? `\n\n${fa.codeAssistant.debug.fixedCode}:\n${d.codeFix}`
                  : ""
              }`
            );
            break;
          }
          default:
            break;
        }
      },
    })
  );

  const _handleCopy = () => {
    // Intentionally ignoring copy errors
    try {
      // no await to keep UI snappy
      navigator.clipboard.writeText(output).catch(() => {
        /* ignore */
      });
    } catch {
      // noop
    }
  };

  const handleExecute = () => {
    if (!(inputCode.trim() && modelId)) {
      return;
    }
    runMutation.mutate({
      mode,
      language,
      modelId,
      prompt: mode === "generate" ? inputCode : undefined,
      code: mode !== "generate" ? inputCode : undefined,
      error: mode === "debug" ? errorMessage : undefined,
    });
  };

  const currentMutation = runMutation;

  // History
  const runsQuery = useQuery(orpc.code.listRuns.queryOptions());
  const deleteRunMutation = useMutation(
    orpc.code.deleteRun.mutationOptions({
      onSuccess: () => {
        runsQuery.refetch();
      },
    })
  );

  type RunItem = {
    id: number;
    mode: string;
    language: string;
    inputText: string;
    errorText?: string | null;
    output: string;
    modelId: number;
    createdAt: string | Date;
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: straightforward parsing/formatting for four modes
  const formatRunOutput = useCallback((run: RunItem): string => {
    try {
      const parsed = JSON.parse(run.output) as unknown;
      if (run.mode === "generate") {
        return (parsed as { generatedCode?: string }).generatedCode || "";
      }
      if (run.mode === "explain") {
        return (parsed as { explanation?: string }).explanation || "";
      }
      if (run.mode === "review") {
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
      if (run.mode === "debug") {
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
      return run.output;
    } catch {
      return run.output;
    }
  }, []);

  const handleLoadRun = useCallback(
    (run: RunItem) => {
      setModelId(run.modelId);
      if (languages.some((l) => l.value === run.language)) {
        setLanguage(run.language as ProgrammingLanguage);
      }
      if (["generate", "explain", "review", "debug"].includes(run.mode)) {
        setMode(run.mode as CodeMode);
      }
      setInputCode(run.inputText || "");
      setErrorMessage(run.errorText || "");
      setOutput(formatRunOutput(run));
    },
    [setModelId, formatRunOutput]
  );
  const selectedRunQuery = useQuery(
    orpc.code.getRun.queryOptions({
      input: { id: Number.parseInt(search.runId || "0", 10) },
      enabled: Boolean(search.runId),
    })
  );
  useEffect(() => {
    if (selectedRunQuery.data) {
      handleLoadRun(selectedRunQuery.data as unknown as RunItem);
    }
  }, [selectedRunQuery.data, handleLoadRun]);

  const canExecute = Boolean(
    inputCode.trim() &&
      modelId &&
      !modelsLoading &&
      (mode !== "debug" || errorMessage.trim()) &&
      !currentMutation.isPending
  );

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Controls Header */}
      <div className="bg-background p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Mode */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.codeAssistant.labels.mode}
            </div>
            <Select
              disabled={currentMutation.isPending}
              onValueChange={(v) => setMode(v as CodeMode)}
              value={mode}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modes.map((m) => (
                  <SelectItem
                    className="text-right"
                    key={m.value}
                    value={m.value}
                  >
                    <div className="flex items-center gap-2">
                      <m.icon className="h-4 w-4" />
                      {m.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.codeAssistant.labels.language}
            </div>
            <Select
              disabled={currentMutation.isPending}
              onValueChange={(v) => setLanguage(v as ProgrammingLanguage)}
              value={language}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {languages.map((lang) => (
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

          {/* Model */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">
              {fa.codeAssistant.labels.model}
            </div>
            <Select
              disabled={currentMutation.isPending || modelsLoading}
              onValueChange={(value) => setModelId(Number(value))}
              value={modelId?.toString()}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue
                  placeholder={
                    modelsLoading
                      ? fa.general.loadingModels
                      : fa.general.selectModel
                  }
                />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modelList?.map((model) => (
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

          {/* Execute Button */}
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm opacity-0">
              {fa.codeAssistant.labels.active}
            </div>
            <Button
              className="w-full"
              disabled={!canExecute}
              onClick={handleExecute}
            >
              {currentMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  {fa.codeAssistant.buttons.processing}
                </>
              ) : (
                <>
                  <Play className="ml-2 h-4 w-4" />
                  {fa.codeAssistant.buttons.execute}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 p-4">
        {/* Input Code */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">
              {mode === "generate"
                ? fa.codeAssistant.labels.codeRequest
                : fa.codeAssistant.labels.inputCode}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {fa.codeAssistant.charCount(inputCode.length)}
              </span>
            </div>
          </div>
          <Textarea
            autoCapitalize="off"
            autoCorrect="off"
            className={cn(
              "min-h-[200px] resize-none font-mono text-sm",
              (inputCode ? detectTextDirection(inputCode) : "ltr") === "rtl"
                ? "text-right"
                : "text-left"
            )}
            dir={inputCode ? detectTextDirection(inputCode) : "ltr"}
            disabled={currentMutation.isPending}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={
              mode === "generate"
                ? fa.codeAssistant.placeholders.codeRequest
                : fa.codeAssistant.placeholders.inputCode
            }
            spellCheck={false}
            value={inputCode}
          />
          {mode !== "generate" && inputCode.trim() && (
            <div className="mt-3 rounded-md border p-3 text-left" dir="ltr">
              <Response>{`\`\`\`${language}\n${inputCode}\n\`\`\``}</Response>
            </div>
          )}
        </Card>

        {/* Error Input (for debug mode) */}
        {mode === "debug" && (
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
                (errorMessage ? detectTextDirection(errorMessage) : "ltr") ===
                  "rtl"
                  ? "text-right"
                  : "text-left"
              )}
              dir={errorMessage ? detectTextDirection(errorMessage) : "ltr"}
              disabled={currentMutation.isPending}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder={fa.codeAssistant.placeholders.errorMessage}
              spellCheck={false}
              value={errorMessage}
            />
            {errorMessage.trim() && (
              <div className="mt-3 rounded-md border p-3 text-left" dir="ltr">
                <Response>{`\`\`\`text\n${errorMessage}\n\`\`\``}</Response>
              </div>
            )}
          </Card>
        )}

        {/* Output */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">{fa.codeAssistant.labels.result}</h3>
            {output && null}
          </div>
          <div className="min-h-[200px] text-left" dir="ltr">
            <Response>
              {mode === "generate" && output
                ? `\`\`\`${language}\n${output}\n\`\`\``
                : output}
            </Response>
          </div>
        </Card>

        {/* Error Display */}
        {(currentMutation.isError || modelsError) && (
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <span>
                {modelsError
                  ? "Failed to load models. Please refresh the page."
                  : fa.codeAssistant.messages.processingError}
              </span>
              <span>{fa.codeAssistant.messages.tryAgain}</span>
            </div>
          </Alert>
        )}

        {/* History */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">تاریخچه</h3>
          </div>
          <div className="space-y-2">
            {runsQuery.isLoading && (
              <div className="text-muted-foreground text-sm">
                در حال بارگذاری…
              </div>
            )}
            {runsQuery.data?.length === 0 && (
              <div className="text-muted-foreground text-sm">
                موردی موجود نیست
              </div>
            )}
            {runsQuery.data?.map((run) => {
              let Icon = Code;
              if (run.mode === "explain") {
                Icon = FileText;
              } else if (run.mode === "review") {
                Icon = Shield;
              } else if (run.mode === "debug") {
                Icon = Bug;
              }
              const when = new Date(run.createdAt);
              const date = when.toLocaleString("fa-IR", {
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  className="flex items-start justify-between gap-2 rounded-md border p-2 hover:bg-accent"
                  key={run.id}
                >
                  <button
                    className="text-right"
                    onClick={() => handleLoadRun(run)}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{run.mode}</span>
                      <span className="text-muted-foreground text-xs">
                        {run.language}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        • {date}
                      </span>
                    </div>
                    <div className="line-clamp-1 text-muted-foreground text-xs">
                      {run.inputText}
                    </div>
                  </button>
                  <button
                    aria-label="delete"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deleteRunMutation.isPending}
                    onClick={() => deleteRunMutation.mutate({ id: run.id })}
                    title="حذف"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
