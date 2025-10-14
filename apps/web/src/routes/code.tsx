import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Bug, Code, Copy, FileText, Loader2, Play, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { orpc, queryClient } from "@/utils/orpc";

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

function RouteComponent() {
  const search = useSearch({ from: "/code" }) as { id?: string };
  const navigate = useNavigate();
  const [mode, setMode] = useState<CodeMode>("generate");
  const [language, setLanguage] = useState<ProgrammingLanguage>("javascript");
  const [inputCode, setInputCode] = useState("");
  const [context, setContext] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [output, setOutput] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const lastSessionIdRef = useRef<number | null>(null);

  const {
    modelId,
    setModelId,
    models: modelList,
    isLoading: modelsLoading,
    error: modelsError,
  } = useCodeModelSelection();

  // Load session if ID is provided in URL
  const { data: selectedSession } = useQuery(
    orpc.code.getSession.queryOptions({
      input: { id: Number.parseInt(search.id || "0", 10) },
      enabled: !!search.id,
    })
  );

  const createSessionMutation = useMutation(
    orpc.code.createSession.mutationOptions()
  );

  const generateCodeMutation = useMutation(
    orpc.code.generateCode.mutationOptions({
      onSuccess: (data) => {
        setOutput(data.generatedCode || "");
        const sid = lastSessionIdRef.current || sessionId || 0;
        // Refresh session and sidebar
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({ input: { id: sid } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.code.getGenerations.queryKey({ input: { sessionId: sid } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.code.listSessions.queryKey(),
        });
        // Navigate to the session detail page so users see history immediately
        if (sid) {
          navigate({ to: "/code/$id", params: { id: String(sid) } });
        }
      },
    })
  );

  const explainCodeMutation = useMutation(
    orpc.code.explainCode.mutationOptions({
      onSuccess: (data) => {
        setOutput(data.explanation || "");
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({
            input: { id: sessionId || 0 },
          }),
        });
      },
    })
  );

  const reviewCodeMutation = useMutation(
    orpc.code.reviewCode.mutationOptions({
      onSuccess: (data) => {
        const reviewText = `${fa.codeAssistant.review.overallScore}: ${data.overallScore}/10\n\n${data.feedback}\n\n${fa.codeAssistant.review.suggestions}:\n${data.suggestions?.map((s) => `- ${s.message}`).join("\n") || fa.codeAssistant.review.noSuggestions}`;
        setOutput(reviewText);
        const sid = lastSessionIdRef.current || sessionId || 0;
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({ input: { id: sid } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.code.getReviews.queryKey({ input: { sessionId: sid } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.code.listSessions.queryKey(),
        });
      },
    })
  );

  const debugCodeMutation = useMutation(
    orpc.code.debugCode.mutationOptions({
      onSuccess: (data) => {
        const debugText = `${fa.codeAssistant.debug.rootCause}: ${data.rootCause}\n\n${fa.codeAssistant.debug.solution}: ${data.solution}${data.codeFix ? `\n\n${fa.codeAssistant.debug.fixedCode}:\n${data.codeFix}` : ""}${data.prevention ? `\n\n${fa.codeAssistant.debug.prevention}:\n${data.prevention.map((p) => `- ${p}`).join("\n")}` : ""}`;
        setOutput(debugText);
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({
            input: { id: sessionId || 0 },
          }),
        });
      },
    })
  );

  // Load session data when selectedSession changes
  useEffect(() => {
    if (selectedSession) {
      setSessionId(selectedSession.id);
      const incoming = selectedSession.language as string;
      const isSupported = languages.some((l) => l.value === incoming);
      if (isSupported) {
        setLanguage(incoming as ProgrammingLanguage);
      }
    }
  }, [selectedSession]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(output)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  };

  const handleExecute = () => {
    const executeWithSession = (sid: number) => {
      lastSessionIdRef.current = sid;
      if (!(inputCode.trim() && modelId)) {
        return;
      }

      const shared = {
        language,
        modelId,
      };

      switch (mode) {
        case "generate":
          generateCodeMutation.mutate({
            sessionId: sid,
            prompt: inputCode,
            context: context.trim() || undefined,
            ...shared,
          });
          break;
        case "explain":
          explainCodeMutation.mutate({
            sessionId: sid,
            code: inputCode,
            ...shared,
          });
          break;
        case "review":
          reviewCodeMutation.mutate({
            sessionId: sid,
            code: inputCode,
            ...shared,
          });
          break;
        case "debug":
          if (!errorMessage.trim()) {
            console.error(fa.codeAssistant.messages.errorRequired);
            return;
          }
          debugCodeMutation.mutate({
            sessionId: sid,
            code: inputCode,
            error: errorMessage,
            ...shared,
          });
          break;
        default:
          break;
      }
    };

    if (!sessionId) {
      // Create session first, then immediately execute the selected action
      createSessionMutation.mutate(
        {
          title: fa.codeAssistant.newSessionTitle(
            modes.find((m) => m.value === mode)?.label || ""
          ),
          language,
        },
        {
          onSuccess: (data) => {
            setSessionId(data.id);
            // Update sidebar list promptly
            queryClient.invalidateQueries({
              queryKey: orpc.code.listSessions.queryKey(),
            });
            executeWithSession(data.id);
          },
        }
      );
      return;
    }

    executeWithSession(sessionId);
  };

  const currentMutation = {
    generate: generateCodeMutation,
    explain: explainCodeMutation,
    review: reviewCodeMutation,
    debug: debugCodeMutation,
  }[mode];

  const canExecute = Boolean(
    inputCode.trim() &&
      modelId &&
      !modelsLoading &&
      (mode !== "debug" || errorMessage.trim()) &&
      !currentMutation.isPending &&
      !createSessionMutation.isPending
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
              {currentMutation.isPending || createSessionMutation.isPending ? (
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
        {/* Context Input (for generate mode) */}
        {mode === "generate" && (
          <Card className="p-4">
            <div className="mb-2">
              <h3 className="font-medium">{fa.codeAssistant.labels.context}</h3>
            </div>
            <Textarea
              className="min-h-[100px] resize-none"
              disabled={currentMutation.isPending}
              onChange={(e) => setContext(e.target.value)}
              placeholder={fa.codeAssistant.placeholders.context}
              value={context}
            />
          </Card>
        )}

        {/* Error Input (for debug mode) */}
        {mode === "debug" && (
          <Card className="p-4">
            <div className="mb-2">
              <h3 className="font-medium">
                {fa.codeAssistant.labels.errorMessage}
              </h3>
            </div>
            <Textarea
              className="min-h-[100px] resize-none"
              disabled={currentMutation.isPending}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder={fa.codeAssistant.placeholders.errorMessage}
              value={errorMessage}
            />
          </Card>
        )}

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
            className="min-h-[200px] resize-none font-mono text-sm"
            disabled={currentMutation.isPending}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={
              mode === "generate"
                ? fa.codeAssistant.placeholders.codeRequest
                : fa.codeAssistant.placeholders.inputCode
            }
            value={inputCode}
          />
        </Card>

        {/* Output */}
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">{fa.codeAssistant.labels.result}</h3>
            {output && (
              <Button
                className={copySuccess ? "bg-green-600 hover:bg-green-700" : ""}
                onClick={handleCopy}
                size="sm"
                variant={copySuccess ? "default" : "ghost"}
              >
                <Copy className="h-4 w-4" />
                {copySuccess
                  ? fa.codeAssistant.buttons.copied
                  : fa.codeAssistant.buttons.copy}
              </Button>
            )}
          </div>
          <Textarea
            className="min-h-[200px] resize-none font-mono text-sm"
            placeholder={fa.codeAssistant.placeholders.result}
            readOnly
            value={output}
          />
        </Card>

        {/* Error Display */}
        {(currentMutation.isError ||
          createSessionMutation.isError ||
          modelsError) && (
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
      </div>
    </div>
  );
}
