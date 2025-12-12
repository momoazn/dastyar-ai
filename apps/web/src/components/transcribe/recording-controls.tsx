import { Mic, Square } from "lucide-react";
import { Badge, Button, Progress } from "@/components/ui";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatElapsed } from "@/hooks/use-voice-recorder";
import { fa } from "@/lib/persian-texts";

const MAX_DURATION_MS = 60_000;

type RecordingControlsProps = {
  isRecording: boolean;
  isTranscribing: boolean;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
};

const getBadgeVariant = (
  isRecording: boolean,
  isTranscribing: boolean
): "default" | "secondary" | "destructive" | "outline" => {
  if (isRecording) return "destructive";
  if (isTranscribing) return "secondary";
  return "outline";
};

const getStatusText = (
  isRecording: boolean,
  isTranscribing: boolean,
  elapsedMs: number
): string => {
  if (isRecording) {
    return `${fa.transcribe.recordingPrefix} • ${formatElapsed(elapsedMs)}`;
  }
  if (isTranscribing) return fa.transcribe.transcribing;
  return fa.transcribe.idle;
};

export function RecordingControls({
  isRecording,
  isTranscribing,
  elapsedMs,
  onStart,
  onStop,
}: RecordingControlsProps) {
  const statusText = getStatusText(isRecording, isTranscribing, elapsedMs);
  const badgeVariant = getBadgeVariant(isRecording, isTranscribing);
  const progressValue = Math.min(100, (elapsedMs / MAX_DURATION_MS) * 100);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {isTranscribing ? (
            <LoadingSpinner className="size-4" />
          ) : (
            <span
              className={`inline-block size-2 rounded-full ${
                isRecording ? "bg-red-500" : "bg-muted-foreground/40"
              }`}
            />
          )}
          <Badge aria-live="polite" variant={badgeVariant}>
            {statusText}
          </Badge>
        </div>
        <div className="text-muted-foreground text-xs">
          {isRecording
            ? `${fa.transcribe.elapsedLabel}: ${formatElapsed(elapsedMs)}`
            : ""}
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="flex items-center justify-center">
          <Button
            aria-label={
              isRecording ? fa.transcribe.recordStop : fa.transcribe.recordStart
            }
            aria-pressed={isRecording}
            className={`gap-2 ${isRecording ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            disabled={isTranscribing}
            onClick={isRecording ? onStop : onStart}
            size="default"
            type="button"
            variant={isRecording ? "destructive" : "default"}
          >
            {isRecording ? (
              <>
                <Square className="size-5" />
                {fa.transcribe.recordStop}
              </>
            ) : (
              <>
                <Mic className="size-5" />
                {fa.transcribe.recordStart}
              </>
            )}
          </Button>
        </div>
        <div className="mt-4">
          <Progress value={isRecording ? progressValue : 0} />
        </div>
      </div>
    </>
  );
}
