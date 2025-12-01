import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Bug, Code, Copy, FileText, Loader2, Play, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Response } from "@/components/ai-elements/response";
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
import { useCodeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { cn, detectTextDirection } from "@/lib/utils";
import { orpc, queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/code/")({
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
  | "rust"
  | "csharp"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "scala"
  | "r"
  | "sql"
  | "html"
  | "css"
  | "bash"
  | "dart";

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
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "scala", label: "Scala" },
  { value: "r", label: "R" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "bash", label: "Bash" },
  { value: "dart", label: "Dart" },
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: UI composition with conditional blocks
function RouteComponent() {
  const search = useSearch({ from: "/code/" }) as { fromId?: string };
  const [mode, setMode] = useState<CodeMode>("generate");
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript");
  const [inputCode, setInputCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [output, setOutput] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const {
    modelId,
    setModelId,
    models: modelList,
    isLoading: modelsLoading,
    error: modelsError,
  } = useCodeModelSelection();

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

  const runMutation = useMutation(
    orpc.code.run.mutationOptions({
      onSuccess: (data) => {
        // Invalidate queries to update sidebar history
        queryClient.invalidateQueries({
          queryKey: orpc.code.listRuns.queryKey(),
        });
        // Use returned payload directly based on current mode
        setOutput(formatImmediateOutput(mode, data));
        // Stay on the same page to allow quick iterations
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
      input: { id: Number.parseInt(search.fromId || "0", 10) },
      enabled: Boolean(search.fromId),
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
    <ToolScaffold
      alerts={
        (currentMutation.isError || modelsError) && (
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
        )
      }
      content={
        <div className="flex max-h-[calc(100vh-200px)] flex-col gap-6 overflow-hidden">
          {/* Title Header */}
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-2xl">{fa.codeAssistant.title}</h1>
          </div>

          {/* Options Section */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      {model.identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Action Button */}
          <div className="flex justify-end">
            <Button
              className="min-w-[160px] gap-2"
              disabled={!canExecute}
              onClick={handleExecute}
              type="button"
            >
              {currentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {fa.codeAssistant.buttons.processing}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm">
                    {fa.codeAssistant.buttons.execute}
                  </span>
                  <Play className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Two Column Layout */}
          <div
            className="grid min-h-0 w-full flex-1 grid-cols-1 gap-4 lg:grid-cols-2"
            dir="rtl"
          >
            {/* Input Column (Right) */}
            <Card className="flex min-h-0 flex-1 flex-col py-0 lg:order-1">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex h-8 items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {mode === "generate"
                      ? fa.codeAssistant.labels.codeRequest
                      : fa.codeAssistant.labels.inputCode}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={cn(
                    "h-full resize-none border-none p-0 font-mono text-sm shadow-none focus-visible:ring-0",
                    (inputCode ? detectTextDirection(inputCode) : "ltr") ===
                      "rtl"
                      ? "text-right"
                      : "text-left"
                  )}
                  dir={inputCode ? detectTextDirection(inputCode) : "ltr"}
                  disabled={currentMutation.isPending}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={(() => {
                    switch (mode) {
                      case "generate":
                        return "مثال: یک مولد رمز عبور امن با قابلیت تنظیم طول و کاراکترها";
                      case "explain":
                        return "مثال: function calculateSum(a, b) { return a + b; }";
                      case "review":
                        return "مثال: function calculateSum(a, b) { return a + b; }";
                      case "debug":
                        return "مثال: function calculateSum(a, b) { return a + b; }";
                      default:
                        return "کد خود را اینجا وارد کنید...";
                    }
                  })()}
                  spellCheck={false}
                  value={inputCode}
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
                    {output && (
                      <Button
                        className={
                          isCopied ? "bg-green-600 hover:bg-green-700" : ""
                        }
                        onClick={_handleCopy}
                        size="sm"
                        type="button"
                        variant={isCopied ? "default" : "ghost"}
                      >
                        <Copy className="h-4 w-4" />
                        {isCopied
                          ? fa.codeAssistant.copied
                          : fa.codeAssistant.copy}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                {currentMutation.isPending ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="text-muted-foreground text-sm">
                        {fa.codeAssistant.buttons.processing}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto text-left" dir="ltr">
                    <Response>
                      {mode === "generate" && output
                        ? `\`\`\`${language}\n${output}\n\`\`\``
                        : output}
                    </Response>
                  </div>
                )}
              </div>
            </Card>
          </div>

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
                placeholder="مثال: TypeError: Cannot read property 'length' of undefined"
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
        </div>
      }
    />
  );
}
const formatImmediateOutput = (m: CodeMode, data: unknown): string => {
  try {
    if (m === "generate") {
      const payload = data as { generatedCode?: string };
      return String(payload.generatedCode ?? "");
    }
    if (m === "explain") {
      const payload = data as { explanation?: string };
      return String(payload.explanation ?? "");
    }
    if (m === "review") {
      const payload = data as { feedback?: string; suggestions?: string[] };
      const suggestions = (payload.suggestions ?? [])
        .map((s) => `- ${s}`)
        .join("\n");
      return `${payload.feedback ?? ""}${
        suggestions
          ? `\n\n${fa.codeAssistant.review.suggestions}:\n${suggestions}`
          : ""
      }`;
    }
    const payload = data as {
      rootCause?: string;
      solution?: string;
      codeFix?: string;
    };
    return `${fa.codeAssistant.debug.rootCause}: ${payload.rootCause ?? ""}\n\n${
      fa.codeAssistant.debug.solution
    }: ${payload.solution ?? ""}${
      payload.codeFix
        ? `\n\n${fa.codeAssistant.debug.fixedCode}:\n${payload.codeFix}`
        : ""
    }`;
  } catch {
    return "";
  }
};
