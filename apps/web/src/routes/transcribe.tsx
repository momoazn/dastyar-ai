import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CopyIcon, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  RecordingControls,
  SmartActionsToolbar,
  SmartResultCard,
} from "@/components/transcribe";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { Label } from "@/components/ui/label";
import { useTranscription } from "@/hooks/use-transcription";
import {
  type RecordingError,
  useVoiceRecorder,
} from "@/hooks/use-voice-recorder";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/transcribe")({
  component: () => (
    <ProtectedLayout>
      <RouteComponent />
    </ProtectedLayout>
  ),
});

const mapRecordingError = (error: RecordingError): string => {
  switch (error) {
    case "micAccessDenied":
      return fa.transcribe.errors.micAccess;
    case "noAudioCaptured":
      return fa.transcribe.errors.noAudio;
    case "fileTooLarge":
      return fa.transcribe.errors.fileTooLarge;
    default:
      return fa.transcribe.errors.processFailed;
  }
};

const getSmartActionTitle = (
  mode: "action-items" | "meeting-notes" | "concise"
): string => {
  switch (mode) {
    case "action-items":
      return fa.transcribe.smartActions.actionItems;
    case "meeting-notes":
      return fa.transcribe.smartActions.meetingNotes;
    default:
      return fa.transcribe.smartActions.summarize;
  }
};

function RouteComponent() {
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [model, setModel] = useState<string>("ggml-base.bin");
  const [smartResult, setSmartResult] = useState<string | null>(null);
  const [smartActionTitle, setSmartActionTitle] = useState<string | null>(null);
  const processedFileRef = useRef<File | null>(null);

  const {
    isRecording,
    elapsedMs,
    startRecording,
    stopRecording,
    error: recordingError,
    recordedFile,
    clearRecordedFile,
  } = useVoiceRecorder();

  const { data: models } = useQuery(orpc.transcribe.models.queryOptions());
  const { data: llmModels } = useQuery(orpc.models.list.queryOptions());

  const { transcribe, isPending: isTranscribing } = useTranscription({
    onSuccess: (data) => {
      setResult(data);
      clearRecordedFile();
      setSmartResult(null);
    },
    onError: (message) => {
      setTranscribeError(message || fa.transcribe.errors.transcribeFailed);
    },
  });

  const { mutate: summarize, isPending: isSummarizing } = useMutation(
    orpc.summarize.create.mutationOptions({
      onSuccess: (data) => setSmartResult(data.summaryText || ""),
      onError: (error) => setTranscribeError(error.message),
    })
  );

  const handleSmartAction = (
    mode: "action-items" | "meeting-notes" | "concise"
  ) => {
    if (!llmModels?.length) {
      setTranscribeError("No AI models available for processing.");
      return;
    }
    setSmartActionTitle(getSmartActionTitle(mode));
    setSmartResult(null);
    summarize({
      text: result,
      mode,
      tone: "professional",
      modelId: llmModels[0].id,
    });
  };

  useEffect(() => {
    if (recordedFile && recordedFile !== processedFileRef.current) {
      processedFileRef.current = recordedFile;
      setTranscribeError(null);
      setResult("");
      setSmartResult(null);
      transcribe({ file: recordedFile, language, model });
    }
  }, [recordedFile, transcribe, language, model]);

  const handleStartRecording = async () => {
    setTranscribeError(null);
    setResult("");
    setSmartResult(null);
    await startRecording();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore copy failures
    }
  };

  const handleClear = () => {
    setResult("");
    setSmartResult(null);
    setTranscribeError(null);
  };

  const displayError = recordingError
    ? mapRecordingError(recordingError)
    : transcribeError;

  return (
    <ToolScaffold
      alerts={
        displayError ? (
          <Alert variant="destructive">
            <AlertTitle>{fa.general.error}</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : null
      }
      content={
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>{fa.transcribe.title}</CardTitle>
              <CardDescription>{fa.transcribe.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid items-end gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label
                        className="text-muted-foreground text-xs"
                        htmlFor="language-select"
                      >
                        {fa.translation.sourceLanguage}
                      </Label>
                      <Select
                        onValueChange={(v) => setLanguage(v as "fa" | "en")}
                        value={language}
                      >
                        <SelectTrigger
                          className="w-full"
                          id="language-select"
                          size="sm"
                        >
                          <SelectValue
                            placeholder={fa.translation.sourceLanguage}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fa">
                            {fa.languages.persian}
                          </SelectItem>
                          <SelectItem value="en">
                            {fa.languages.english}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label
                        className="text-muted-foreground text-xs"
                        htmlFor="model-select"
                      >
                        {fa.modelSelection.speechModel}
                      </Label>
                      <Select
                        disabled={!models?.length}
                        onValueChange={setModel}
                        value={model}
                      >
                        <SelectTrigger
                          className="w-full"
                          id="model-select"
                          size="sm"
                        >
                          <SelectValue
                            placeholder={fa.modelSelection.selectSpeechModel}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {models?.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <RecordingControls
                    elapsedMs={elapsedMs}
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    onStart={handleStartRecording}
                    onStop={stopRecording}
                  >
                    {result && !isRecording && !isTranscribing ? (
                      <SmartActionsToolbar
                        disabled={isSummarizing}
                        onAction={handleSmartAction}
                      />
                    ) : null}
                  </RecordingControls>
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {fa.transcribe.title}
                    </div>
                    <div className="flex items-center gap-2">
                      {recordedFile && !isTranscribing && (
                        <Button
                          className="gap-2"
                          onClick={() =>
                            transcribe({ file: recordedFile, language, model })
                          }
                          type="button"
                          variant="outline"
                        >
                          <RefreshCcw className="size-4" /> {fa.general.retry}
                        </Button>
                      )}
                      <Button
                        className="gap-2"
                        disabled={!result}
                        onClick={() => handleCopy(result)}
                        type="button"
                        variant="default"
                      >
                        <CopyIcon className="size-4" /> {fa.transcribe.copy}
                      </Button>
                      <Button
                        className="gap-2"
                        disabled={!result || isRecording || isTranscribing}
                        onClick={handleClear}
                        type="button"
                        variant="secondary"
                      >
                        <Trash2 className="size-4" /> {fa.transcribe.clear}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    aria-label={fa.transcribe.title}
                    className={
                      language === "fa" ? "rtl text-right" : "ltr text-left"
                    }
                    dir={language === "fa" ? "rtl" : "ltr"}
                    placeholder={fa.transcribe.resultPlaceholder}
                    readOnly
                    rows={14}
                    value={result}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter />
          </Card>

          <SmartResultCard
            isLoading={isSummarizing}
            onCopy={handleCopy}
            result={smartResult}
            title={smartActionTitle}
          />
        </div>
      }
    />
  );
}
