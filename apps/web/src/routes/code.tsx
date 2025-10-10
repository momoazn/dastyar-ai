import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from '@tanstack/react-router';
import { Bug, Code, Copy, FileText, Loader2, Play, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
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
} from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { orpc, queryClient } from '@/utils/orpc';

export const Route = createFileRoute('/code')({
  component: CodeAssistantPage,
});

type CodeMode = 'generate' | 'explain' | 'review' | 'debug';
type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'go'
  | 'rust';

const modes: Array<{
  value: CodeMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'generate', label: fa.codeAssistant.modes.generate, icon: Code },
  { value: 'explain', label: fa.codeAssistant.modes.explain, icon: FileText },
  { value: 'review', label: fa.codeAssistant.modes.review, icon: Shield },
  { value: 'debug', label: fa.codeAssistant.modes.debug, icon: Bug },
];

const languages: Array<{ value: ProgrammingLanguage; label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

function CodeAssistantPage() {
  const search = useSearch({ from: '/code' }) as { id?: string };
  const navigate = useNavigate();
  const [mode, setMode] = useState<CodeMode>('generate');
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [modelId, setModelId] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [context, setContext] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [output, setOutput] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: modelList } = useQuery(
    orpc.models.list.queryOptions({ input: { isEnabled: true } })
  );

  // Load session if ID is provided in URL
  const { data: selectedSession } = useQuery(
    orpc.code.getSession.queryOptions({
      input: { id: Number.parseInt(search.id || '0', 10) },
      enabled: !!search.id,
    })
  );

  const createSessionMutation = useMutation(
    orpc.code.createSession.mutationOptions({
      onSuccess: (data) => {
        setSessionId(data.id);
        navigate({
          to: '/code',
          search: { id: data.id },
        });
      },
    })
  );

  const generateCodeMutation = useMutation(
    orpc.code.generateCode.mutationOptions({
      onSuccess: (data) => {
        setOutput(data.generatedCode || '');
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({
            input: { id: sessionId || 0 },
          }),
        });
      },
    })
  );

  const explainCodeMutation = useMutation(
    orpc.code.explainCode.mutationOptions({
      onSuccess: (data) => {
        setOutput(data.explanation || '');
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
        const reviewText = `${fa.codeAssistant.review.overallScore}: ${data.overallScore}/10\n\n${data.feedback}\n\n${fa.codeAssistant.review.suggestions}:\n${data.suggestions?.map((s) => `- ${s.message}`).join('\n') || fa.codeAssistant.review.noSuggestions}`;
        setOutput(reviewText);
        queryClient.invalidateQueries({
          queryKey: orpc.code.getSession.queryKey({
            input: { id: sessionId || 0 },
          }),
        });
      },
    })
  );

  const debugCodeMutation = useMutation(
    orpc.code.debugCode.mutationOptions({
      onSuccess: (data) => {
        const debugText = `${fa.codeAssistant.debug.rootCause}: ${data.rootCause}\n\n${fa.codeAssistant.debug.solution}: ${data.solution}${data.codeFix ? `\n\n${fa.codeAssistant.debug.fixedCode}:\n${data.codeFix}` : ''}${data.prevention ? `\n\n${fa.codeAssistant.debug.prevention}:\n${data.prevention.map((p) => `- ${p}`).join('\n')}` : ''}`;
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
      setLanguage(selectedSession.language as ProgrammingLanguage);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (modelList && modelList.length > 0 && !modelId) {
      setModelId(modelList[0].name);
    }
  }, [modelList, modelId]);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(output)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        console.error('Failed to copy to clipboard');
      });
  };

  const handleExecute = () => {
    if (!sessionId) {
      // Create session first
      createSessionMutation.mutate({
        title: `کد ${modes.find((m) => m.value === mode)?.label}`,
        language,
      });
      return;
    }

    if (!(inputCode.trim() && modelId)) {
      return;
    }

    const commonParams = {
      sessionId,
      code: inputCode,
      language,
      modelName: modelId,
    };

    switch (mode) {
      case 'generate':
        generateCodeMutation.mutate({
          ...commonParams,
          prompt: inputCode,
          context: context.trim() || undefined,
        });
        break;
      case 'explain':
        explainCodeMutation.mutate(commonParams);
        break;
      case 'review':
        reviewCodeMutation.mutate(commonParams);
        break;
      case 'debug':
        if (!errorMessage.trim()) {
          alert(fa.codeAssistant.messages.errorRequired);
          return;
        }
        debugCodeMutation.mutate({
          ...commonParams,
          error: errorMessage,
        });
        break;
      default:
        break;
    }
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
      (mode !== 'debug' || errorMessage.trim()) &&
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
              disabled={currentMutation.isPending}
              onValueChange={setModelId}
              value={modelId}
            >
              <SelectTrigger className="w-full text-right" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {modelList?.map((model) => (
                  <SelectItem
                    className="text-right"
                    key={model.name}
                    value={model.name}
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
        {mode === 'generate' && (
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
        {mode === 'debug' && (
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
              {mode === 'generate'
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
              mode === 'generate'
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
                className={copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={handleCopy}
                size="sm"
                variant={copySuccess ? 'default' : 'ghost'}
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
        {(currentMutation.isError || createSessionMutation.isError) && (
          <Alert variant="destructive">
            <div className="flex items-center gap-2">
              <span>{fa.codeAssistant.messages.processingError}</span>
              <span>{fa.codeAssistant.messages.tryAgain}</span>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}
