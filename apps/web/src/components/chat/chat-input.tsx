import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ChatAttachments,
  type PendingAttachment,
} from "@/components/chat/attachments";
import { DocumentUploadButton } from "@/components/document-upload-button";
import { TranscribeButton } from "@/components/transcribe-button";
import { Alert, AlertDescription } from "@/components/ui";
import { useChatModelSelection } from "@/hooks/use-feature-model-selection";
import { fa } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

type ChatInputProps = {
  handleSendPrompt: (prompt: string) => void;
  isGenerating?: boolean;
  stopGenerating?: () => void;
  threadId?: number;
};

export const ChatInput = ({
  handleSendPrompt,
  isGenerating,
  stopGenerating,
  threadId,
}: ChatInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [pendingDocs, setPendingDocs] = useState<PendingAttachment[]>([]);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );

  const { modelId, setModelId, models, refetch } = useChatModelSelection({
    threadId,
  });

  // Handle transcription success
  const handleTranscription = (transcribedText: string) => {
    // Append transcribed text to existing prompt
    if (transcribedText.trim()) {
      setPrompt((prev) => {
        const separator = prev.trim() ? " " : "";
        return prev + separator + transcribedText.trim();
      });
    }
  };

  const handleTranscriptionError = (error: string) => {
    console.error("Transcription failed:", error);
    setTranscriptionError(`خطا در تبدیل صدا به متن: ${error}`);
  };

  // Pending document UI updates
  const handleDocStatus = (s: {
    filename: string;
    phase: "extracting" | "uploading" | "indexing" | "done" | "error";
  }) => {
    setPendingDocs((prev) => {
      if (s.phase === "done" || s.phase === "error") {
        return prev.filter((p) => p.filename !== s.filename);
      }
      // Narrow phase to the allowed PendingAttachment phase type
      const phase: PendingAttachment["phase"] =
        s.phase === "extracting" ||
        s.phase === "uploading" ||
        s.phase === "indexing"
          ? s.phase
          : "extracting";
      const existing = prev.find((p) => p.filename === s.filename);
      if (existing) {
        return prev.map((p) =>
          p.filename === s.filename ? { filename: s.filename, phase } : p
        );
      }
      return [...prev, { filename: s.filename, phase }];
    });
  };

  // Memoize text direction calculation
  const textDirection = useMemo(
    () => (prompt ? detectTextDirection(prompt) : "rtl"),
    [prompt]
  );

  // Handle key presses in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        stopGenerating?.();
        return;
      }
      const trimmed = prompt.trim();
      if (trimmed) {
        handleSendPrompt(trimmed);
        setPrompt("");
      }
    }
  };

  // Handle send/stop button click
  const handleSendButtonClick = () => {
    if (isGenerating) {
      stopGenerating?.();
      return;
    }
    const trimmed = prompt.trim();
    if (trimmed) {
      handleSendPrompt(trimmed);
      setPrompt("");
    }
  };

  // Memoize prompt change handler
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Memoize models list rendering
  const modelItems = useMemo(() => {
    if (!models) {
      return [];
    }

    return models.map((model) => ({
      key: model.id.toString(),
      value: model.id.toString(),
      content: (
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-green-500" />
          <span className="text-sm">{model.name}</span>
          {model.provider ? (
            <span className="text-[8px] text-muted-foreground uppercase tracking-wide">
              {model.provider}
            </span>
          ) : null}
        </div>
      ),
    }));
  }, [models]);

  // Get language for transcription based on text direction
  const transcriptionLanguage = useMemo(
    () => (prompt && detectTextDirection(prompt) === "rtl" ? "fa" : "en"),
    [prompt]
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-4" dir="rtl">
      {typeof threadId === "number" && (
        <ChatAttachments
          className="px-1"
          pending={pendingDocs}
          threadId={threadId}
        />
      )}
      <div>
        <PromptInput
          onSubmit={(e) => {
            e.preventDefault();
            handleSendButtonClick();
          }}
        >
          <PromptInputTextarea
            dir={textDirection}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder={fa.chat.writeMessage}
            value={prompt}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputModelSelect
                defaultValue={modelId?.toString()}
                onValueChange={(value) => setModelId(Number(value))}
                value={modelId?.toString()}
              >
                <PromptInputModelSelectTrigger className="h-9 w-80 cursor-pointer gap-2">
                  <PromptInputModelSelectValue
                    placeholder={fa.modelSelection.selectChatModel}
                  />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {modelItems.map((item) => (
                    <PromptInputModelSelectItem
                      key={item.key}
                      value={item.value}
                    >
                      {item.content}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
              <PromptInputButton onClick={() => refetch()} variant="outline">
                <RefreshCcw className="size-4" />
              </PromptInputButton>
            </PromptInputTools>
            <div className="flex items-center gap-2">
              {typeof threadId === "number" && (
                <DocumentUploadButton
                  onStatusChange={handleDocStatus}
                  onUploaded={({ title, indexedChunks }) => {
                    // eslint-disable-next-line no-console
                    console.log(
                      `Document uploaded: ${title} (indexed ${indexedChunks} chunks)`
                    );
                  }}
                  threadId={threadId}
                />
              )}
              <TranscribeButton
                language={transcriptionLanguage}
                onError={handleTranscriptionError}
                onTranscribed={handleTranscription}
                size="icon"
                variant="outline"
              />
              <PromptInputSubmit
                disabled={!(isGenerating || (prompt.trim() && modelId))}
                status={isGenerating ? "streaming" : undefined}
                variant={isGenerating ? "destructive" : "default"}
              />
            </div>
          </PromptInputToolbar>
        </PromptInput>
      </div>
      {transcriptionError && (
        <Alert className="mt-2" variant="destructive">
          <AlertDescription dir="rtl">{transcriptionError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
