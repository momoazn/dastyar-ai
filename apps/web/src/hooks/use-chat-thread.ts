import { useEffect, useRef } from "react";
import type { MyUIMessage } from "@/server/utils/chat";

export function useHydrateInitialMessages(params: {
  threadMessages?: MyUIMessage[];
  messages: MyUIMessage[];
  status: string;
  setMessages: (messages: MyUIMessage[]) => void;
  threadId?: string;
}) {
  const { threadMessages, messages, status, setMessages, threadId } = params;
  const hasHydratedFromThreadRef = useRef(false);

  useEffect(() => {
    if (
      !hasHydratedFromThreadRef.current &&
      threadMessages &&
      messages.length === 0 &&
      status === "ready" &&
      threadId
    ) {
      setMessages(threadMessages);
      hasHydratedFromThreadRef.current = true;
    }
  }, [threadMessages, messages.length, status, setMessages, threadId]);
}
