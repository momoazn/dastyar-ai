import { useCallback, useState } from "react";

interface RAGChatResponse {
  enhancedPrompt: string;
  originalMessage: string;
  context: string;
  sources: { filename: string; chunk: number }[];
  hasDocuments: boolean;
  threadId: string;
}

export const useRAGChat = () => {
  const [isLoading, setIsLoading] = useState(false);

  const enhanceMessageWithRAG = useCallback(
    async (
      message: string,
      threadId: string,
    ): Promise<RAGChatResponse | null> => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, threadId }),
        });

        if (!response.ok) {
          throw new Error("Failed to enhance message");
        }

        return await response.json();
      } catch (error) {
        console.error("RAG enhancement error:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const checkThreadDocuments = useCallback(async (threadId: string) => {
    try {
      const response = await fetch(`/api/threads/${threadId}/has-documents`);
      if (!response.ok) return { hasDocuments: false, documentCount: 0 };
      return await response.json();
    } catch (error) {
      console.error("Document check error:", error);
      return { hasDocuments: false, documentCount: 0 };
    }
  }, []);

  return {
    enhanceMessageWithRAG,
    checkThreadDocuments,
    isLoading,
  };
};
