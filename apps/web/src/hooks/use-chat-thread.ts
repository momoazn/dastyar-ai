import { useCallback } from "react";
import { toast } from "sonner";
import { fa } from "@/lib/persian-texts";
import { client, orpc, queryClient } from "@/utils/orpc";

/**
 * Hook for common chat thread operations
 */
export function useChatThread() {
  const createThread = useCallback(async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const created = await client.threads.create({
        title: trimmed.slice(0, 10),
      });

      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });

      return created;
    } catch (error) {
      toast.error(fa.chat.newChatError);
      throw error;
    }
  }, []);

  const renameThread = useCallback(async (threadId: number, prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    try {
      await client.threads.rename({
        id: threadId,
        title: trimmed.slice(0, 10),
      });

      await queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
    } catch (error) {
      toast.error("خطا در تغییر عنوان گفتگو");
      throw error;
    }
  }, []);

  const validatePrompt = useCallback((prompt: string) => prompt.trim(), []);

  return {
    createThread,
    renameThread,
    validatePrompt,
  };
}
