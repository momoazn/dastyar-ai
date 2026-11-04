import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CopyIcon, MicOff, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import {
  SettingField,
  ToolPageHeader,
  ToolPanel,
} from "@/components/tool-page/tool-page";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Surface,
  SurfaceContent,
  SurfaceHeader,
  SurfaceTitle,
} from "@/components/ui";
import { useWhisperAvailable } from "@/hooks/use-runtime-health";
import { useTranscription } from "@/hooks/use-transcription";
import {
  type RecordingError,
  useVoiceRecorder,
} from "@/hooks/use-voice-recorder";
import ProtectedLayout from "@/layouts/protected";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
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

  const isWhisperAvailable = useWhisperAvailable();
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
      onError: (error) =>
        setTranscribeError(
          getErrorMessage(error, fa.transcribe.errors.processFailed)
        ),
    })
  );

  const handleSmartAction = (
    mode: "action-items" | "meeting-notes" | "concise"
  ) => {
    if (!llmModels?.length) {
      setTranscribeError(fa.transcribe.errors.noActiveModel);
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
    if (
      recordedFile &&
      isWhisperAvailable &&
      recordedFile !== processedFileRef.current
    ) {
      processedFileRef.current = recordedFile;
      setTranscribeError(null);
      setResult("");
      setSmartResult(null);
      transcribe({ file: recordedFile, language, model });
    }
  }, [recordedFile, transcribe, language, model, isWhisperAvailable]);

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

  const isBusy = isRecording || isTranscribing;
  const isRtl = language === "fa";

  return (
    <ToolScaffold
      content={
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <ToolPageHeader
            description={fa.transcribe.description}
            title={fa.transcribe.title}
          />
          {isWhisperAvailable ? null : (
            <Alert className="text-muted-foreground">
              <MicOff />
              <AlertTitle className="text-foreground">
                {fa.transcribe.unavailable.title}
              </AlertTitle>
              <AlertDescription>
                {fa.transcribe.unavailable.hint}
              </AlertDescription>
            </Alert>
          )}
          {displayError ? (
            <Alert variant="destructive">
              <AlertTitle>{fa.general.error}</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          ) : null}

          <Surface padded={false}>
            <SurfaceHeader className="bg-muted/30">
              <SurfaceTitle>{fa.transcribe.controlsTitle}</SurfaceTitle>
            </SurfaceHeader>
            <SurfaceContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SettingField label={fa.translation.sourceLanguage}>
                  <Select
                    disabled={isBusy}
                    onValueChange={(v) => setLanguage(v as "fa" | "en")}
                    value={language}
                  >
                    <SelectTrigger
                      aria-label={fa.translation.sourceLanguage}
                      className="w-full"
                      dir="rtl"
                    >
                      <SelectValue
                        placeholder={fa.translation.sourceLanguage}
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="fa">{fa.languages.persian}</SelectItem>
                      <SelectItem value="en">{fa.languages.english}</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
                <SettingField label={fa.modelSelection.speechModel}>
                  <Select
                    disabled={!models?.length || isBusy}
                    onValueChange={setModel}
                    value={model}
                  >
                    <SelectTrigger
                      aria-label={fa.modelSelection.speechModel}
                      className="w-full min-w-0"
                      dir="rtl"
                    >
                      <SelectValue
                        placeholder={fa.modelSelection.selectSpeechModel}
                      />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {models?.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span
                            className="block truncate"
                            dir="ltr"
                            title={m.name}
                          >
                            {m.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingField>
              </div>

              <RecordingControls
                disabled={!isWhisperAvailable}
                elapsedMs={elapsedMs}
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                onStart={handleStartRecording}
                onStop={stopRecording}
              />
            </SurfaceContent>
          </Surface>

          <ToolPanel
            actions={
              <>
                {recordedFile && !isTranscribing && isWhisperAvailable ? (
                  <Button
                    className="gap-2"
                    onClick={() =>
                      transcribe({ file: recordedFile, language, model })
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RefreshCcw className="size-4" /> {fa.general.retry}
                  </Button>
                ) : null}
                {result ? (
                  <>
                    <Button
                      className="gap-2"
                      onClick={() => handleCopy(result)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <CopyIcon className="size-4" /> {fa.transcribe.copy}
                    </Button>
                    <Button
                      className="gap-2"
                      disabled={isBusy}
                      onClick={handleClear}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" /> {fa.transcribe.clear}
                    </Button>
                  </>
                ) : null}
              </>
            }
            bodyClassName="min-h-[320px]"
            footer={
              result && !isBusy ? (
                <div className="border-t px-4 pb-4">
                  <SmartActionsToolbar
                    disabled={isSummarizing}
                    onAction={handleSmartAction}
                  />
                </div>
              ) : null
            }
            title={fa.transcribe.resultTitle}
          >
            {result ? (
              <section
                aria-label={fa.transcribe.resultTitle}
                className={`flex-1 whitespace-pre-wrap break-words text-base leading-8 ${
                  isRtl ? "text-right" : "text-left"
                }`}
                dir={isRtl ? "rtl" : "ltr"}
              >
                {result}
              </section>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground text-sm">
                {isTranscribing
                  ? fa.transcribe.transcribing
                  : fa.transcribe.emptyResult}
              </div>
            )}
          </ToolPanel>

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
