import { useEffect, useRef } from 'react';
import type { MyUIMessage } from '@/server/utils/chat';

export function useHydrateInitialMessages(params: {
  threadMessages?: MyUIMessage[];
  messages: MyUIMessage[];
  status: string;
  initialMessages: MyUIMessage[];
  setMessages: (messages: MyUIMessage[]) => void;
}) {
  const { threadMessages, messages, status, initialMessages, setMessages } =
    params;
  const hasHydratedFromThreadRef = useRef(false);

  useEffect(() => {
    if (
      !hasHydratedFromThreadRef.current &&
      threadMessages &&
      messages.length === 0 &&
      status === 'ready' &&
      initialMessages.length > 0
    ) {
      setMessages(initialMessages);
      hasHydratedFromThreadRef.current = true;
    }
  }, [threadMessages, messages.length, status, initialMessages, setMessages]);
}
