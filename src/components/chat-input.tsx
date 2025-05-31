import { Send, Pause } from "lucide-react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { PDFAttachment } from "@/components/pdf-attachment";
import { useModelsList } from "@/hooks";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";
import type { UploadedPDF } from "@/hooks/use-pdf-upload";

interface ChatInputProps {
  handleSendPrompt: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  chatModel?: string;
  setChatModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  // PDF attachment props
  attachedPDFs?: UploadedPDF[];
  onFileSelect?: (file: File) => void;
  onRemovePDF?: (pdfId: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  hasRAGDocuments?: boolean;
}

export function ChatInput({
  handleSendPrompt,
  isStreaming,
  stopStreaming,
  chatModel,
  setChatModel,
  prompt,
  setPrompt,
  attachedPDFs = [],
  onFileSelect,
  onRemovePDF,
  isUploading = false,
  uploadProgress = 0,
  hasRAGDocuments = false,
}: ChatInputProps) {
  const { data: models } = useModelsList();

  // Handle key presses in the textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) {
        stopStreaming();
      } else {
        handleSendPrompt();
      }
    }
  };

  // Handle send/stop button click
  const handleSendButtonClick = () => {
    if (isStreaming) {
      stopStreaming();
    } else {
      handleSendPrompt();
    }
  };

  return (
    <div className="space-y-4 px-6 py-4">
      {/* RAG Mode Indicator */}
      {hasRAGDocuments && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-2 text-sm dark:border-blue-800 dark:bg-blue-950/20">
          <div className="font-medium text-blue-700 dark:text-blue-300">
            {PERSIAN_TEXTS.chat.ragMode}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {PERSIAN_TEXTS.chat.ragModeDescription}
          </div>
        </div>
      )}

      {/* PDF Attachments */}
      {onFileSelect && onRemovePDF && (
        <PDFAttachment
          attachedPDFs={attachedPDFs}
          onFileSelect={onFileSelect}
          onRemovePDF={onRemovePDF}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          disabled={isStreaming}
        />
      )}

      {/* Message Input Area */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={PERSIAN_TEXTS.chat.writeMessage}
          className="min-h-[60px] w-full resize-none border-0 bg-transparent px-4 py-3 pr-12 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          dir={prompt ? detectTextDirection(prompt) : "rtl"}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between">
        {/* Left side - Model selector */}
        <div className="flex items-center gap-3">
          <Select
            defaultValue={chatModel}
            value={chatModel}
            onValueChange={setChatModel}
          >
            <SelectTrigger className="w-[180px] border-0 bg-transparent text-sm shadow-none focus:ring-0">
              <SelectValue
                placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
              />
            </SelectTrigger>
            <SelectContent>
              {(models || []).map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Send button */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={isStreaming ? "destructive" : "ghost"}
            disabled={!isStreaming && !prompt.trim()}
            onClick={handleSendButtonClick}
            className="size-8"
          >
            {isStreaming ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
