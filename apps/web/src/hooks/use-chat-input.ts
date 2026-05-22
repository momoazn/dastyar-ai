import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/texts";
import { useChatThread } from "./use-chat-thread";

type UseChatInputOptions = {
  threadId?: number;
  renameOnSend?: boolean;
  onSendMessage?: (prompt: string) => Promise<void>;
};

/**
 * Hook for handling chat input logic
 */
export function useChatInput({
  threadId,
  renameOnSend = false,
  onSendMessage,
}: UseChatInputOptions = {}) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const { createThread, renameThread, validatePrompt } = useChatThread();

  const handleSendPrompt = useCallback(
    async (prompt: string) => {
      const validPrompt = validatePrompt(prompt);
      if (!validPrompt || isGenerating) {
        return;
      }

      try {
        setIsGenerating(true);

        if (threadId) {
          if (renameOnSend) {
            await renameThread(threadId, validPrompt);
          }
          if (onSendMessage) await onSendMessage(validPrompt);
        } else {
          // New thread - create and navigate
          const created = await createThread(validPrompt);
          if (created) {
            navigate({
              to: "/chat/$id",
              params: { id: created.id.toString() },
              search: { initialPrompt: validPrompt },
            });
          }
        }
      } catch {
        toast.error(fa.chat.sendMessageError);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      threadId,
      isGenerating,
      validatePrompt,
      createThread,
      renameThread,
      onSendMessage,
      navigate,
      renameOnSend,
    ]
  );

  return {
    handleSendPrompt,
    isGenerating,
  };
}
