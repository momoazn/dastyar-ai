import { Mic, Pause, Send } from "lucide-react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";
import { useAudioRecording } from "@/hooks";
import { useChatModels } from "@/lib/api/chat";
import { PERSIAN_TEXTS } from "@/lib/persian-texts";
import { detectTextDirection } from "@/lib/utils";

interface ChatInputProps {
  handleSendPrompt: () => void;
  isStreaming: boolean;
  stopStreaming: () => void;
  currentChatModel?: string;
  setCurrentChatModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function ChatInput({
  handleSendPrompt,
  isStreaming,
  stopStreaming,
  currentChatModel,
  setCurrentChatModel,
  prompt,
  setPrompt,
}: ChatInputProps) {
  const { isRecording, startRecording, stopRecording } =
    useAudioRecording(setPrompt);

  const { data: chatModels } = useChatModels();

  return (
    <div className="flex min-h-[80px] gap-2 rounded-md">
      <div className="flex flex-1 flex-col gap-4 rounded-md border p-2 transition-all has-[textarea:focus]:ring-2 has-[textarea:focus]:ring-ring has-[textarea:focus]:ring-offset-2">
        {/* Chat Input */}
        <div className="flex-1">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={PERSIAN_TEXTS.chat.writeMessage}
            className="h-full w-full resize-none rounded-none border-none focus-visible:ring-0"
            dir={prompt ? detectTextDirection(prompt) : "rtl"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
          />
        </div>

        {/* Chat Input Buttons And Model Selector */}
        <div className="flex w-full justify-between">
          {/* Model Selector */}
          <Select
            defaultValue={currentChatModel}
            value={currentChatModel}
            onValueChange={setCurrentChatModel}
          >
            <SelectTrigger className="w-[200px] border-none">
              <SelectValue
                placeholder={PERSIAN_TEXTS.modelSelection.selectChatModel}
              />
            </SelectTrigger>
            <SelectContent>
              {chatModels?.data?.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chat Input Buttons */}
          <div className="flex gap-2">
            {/* Record Button */}
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              className="h-10 w-10"
            >
              {isRecording ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Send Button */}
            <Button
              size="icon"
              className="h-10 w-10"
              disabled={!prompt.trim() || isStreaming}
              onClick={() => {
                if (isStreaming) {
                  stopStreaming();
                } else {
                  handleSendPrompt();
                }
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
