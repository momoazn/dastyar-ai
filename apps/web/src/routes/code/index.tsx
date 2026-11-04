import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  Bug,
  Code,
  Copy,
  Download,
  FileText,
  Loader2,
  Play,
  Shield,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Response } from "@/components/ai-elements/response";
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
import { useCodeModelSelection } from "@/hooks/use-feature-model-selection";
import ProtectedLayout from "@/layouts/protected";
import { sanitizeGeneratedCodeOutput } from "@/lib/code-output";
import { fa } from "@/lib/texts";
import { detectTextDirection } from "@/lib/utils";
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

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
      } catch {
        return false;
      }
    }
  };

  const handleCopyOutput = async () => {
    const copyableOutput = output.trim();
    if (!copyableOutput) {
      return;
    }
    const copied = await copyToClipboard(copyableOutput);
    if (!copied) {
      return;
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) {
      return;
    }

    const extension = mode === "generate" ? getCodeExtension(language) : "txt";
    const fileName = `generated-code-${Date.now()}.${extension}`;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
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
        return sanitizeGeneratedCodeOutput(
          (parsed as { generatedCode?: string }).generatedCode || ""
        );
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
                  ? fa.general.modelsRefreshFailed
                  : fa.codeAssistant.messages.processingError}
              </span>
              <span>{fa.codeAssistant.messages.tryAgain}</span>
            </div>
          </Alert>
        )
      }
      content={
        <div className="flex flex-col gap-6">
          <ToolPageHeader
            description={fa.index.codeDescription}
            title={fa.codeAssistant.title}
          />

          <ToolSettings title={fa.codeAssistant.settingsTitle}>
            <SettingField label={fa.codeAssistant.labels.mode}>
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
            </SettingField>
            <SettingField label={fa.codeAssistant.labels.language}>
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
            </SettingField>
            <ModelSelect
              disabled={currentMutation.isPending}
              isLoading={modelsLoading}
              label={fa.codeAssistant.labels.model}
              modelId={modelId}
              models={modelList}
              onChange={setModelId}
            />
          </ToolSettings>

          <div className="flex justify-start">
            <Button
              className={PRIMARY_ACTION_CLASS}
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

          <ToolGrid>
            <div className="flex min-w-0 flex-col gap-4">
              <ToolPanel
                title={
                  mode === "generate"
                    ? fa.codeAssistant.labels.codeRequest
                    : fa.codeAssistant.labels.inputCode
                }
              >
                <Textarea
                  aria-label={
                    mode === "generate"
                      ? fa.codeAssistant.labels.codeRequest
                      : fa.codeAssistant.labels.inputCode
                  }
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="min-h-[300px] flex-1 resize-none border-none bg-transparent p-0 font-mono text-sm shadow-none placeholder:font-sans focus-visible:ring-0"
                  dir={inputCode ? detectTextDirection(inputCode) : "rtl"}
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
              </ToolPanel>

              {mode === "debug" && (
                <ToolPanel
                  bodyClassName="min-h-[120px]"
                  title={fa.codeAssistant.labels.errorMessage}
                >
                  <Textarea
                    aria-label={fa.codeAssistant.labels.errorMessage}
                    autoCapitalize="off"
                    autoCorrect="off"
                    className="min-h-[100px] flex-1 resize-none border-none bg-transparent p-0 font-mono text-sm shadow-none placeholder:font-sans focus-visible:ring-0"
                    dir={
                      errorMessage ? detectTextDirection(errorMessage) : "rtl"
                    }
                    disabled={currentMutation.isPending}
                    onChange={(e) => setErrorMessage(e.target.value)}
                    placeholder={fa.codeAssistant.placeholders.errorMessage}
                    spellCheck={false}
                    value={errorMessage}
                  />
                </ToolPanel>
              )}
            </div>

            <ToolPanel
              actions={
                output ? (
                  <>
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
                      {isCopied
                        ? fa.codeAssistant.copied
                        : fa.codeAssistant.copy}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Download className="h-4 w-4" />
                      {fa.general.download}
                    </Button>
                  </>
                ) : null
              }
              title={fa.codeAssistant.labels.result}
            >
              {currentMutation.isPending ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-muted-foreground text-sm">
                    {fa.codeAssistant.buttons.processing}
                  </div>
                </div>
              ) : null}
              {!currentMutation.isPending && output ? (
                <div className="min-w-0 overflow-x-auto text-left" dir="ltr">
                  <Response
                    className="h-auto w-full"
                    controls={{ code: false }}
                  >
                    {mode === "generate"
                      ? `\`\`\`${language}\n${output}\n\`\`\``
                      : output}
                  </Response>
                </div>
              ) : null}
              {currentMutation.isPending || output ? null : (
                <EmptyHint>{fa.codeAssistant.placeholders.result}</EmptyHint>
              )}
            </ToolPanel>
          </ToolGrid>
        </div>
      }
    />
  );
}
const formatImmediateOutput = (m: CodeMode, data: unknown): string => {
  try {
    if (m === "generate") {
      const payload = data as { generatedCode?: string };
      return sanitizeGeneratedCodeOutput(String(payload.generatedCode ?? ""));
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

const getCodeExtension = (language: ProgrammingLanguage): string => {
  switch (language) {
    case "javascript":
      return "js";
    case "typescript":
      return "ts";
    case "python":
      return "py";
    case "java":
      return "java";
    case "cpp":
      return "cpp";
    case "go":
      return "go";
    case "rust":
      return "rs";
    case "csharp":
      return "cs";
    case "php":
      return "php";
    case "ruby":
      return "rb";
    case "swift":
      return "swift";
    case "kotlin":
      return "kt";
    case "scala":
      return "scala";
    case "r":
      return "r";
    case "sql":
      return "sql";
    case "html":
      return "html";
    case "css":
      return "css";
    case "bash":
      return "sh";
    case "dart":
      return "dart";
    default:
      return "txt";
  }
};
