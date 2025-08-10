import type { UIMessage } from 'ai';
import { useEffect, useRef } from 'react';

type TextPart = { type: 'text'; text: string };
type ReasoningPart = { type: 'reasoning'; text: string };
type UIPart = TextPart | ReasoningPart;

export function mapThreadMessagesToUI(
  rows: (
    | undefined
    | null
    | {
        id: string | null;
        role: unknown;
        content: unknown;
        reasoning?: unknown;
      }
  )[]
): UIMessage[] {
  if (!rows || rows.length === 0) {
    return [] as UIMessage[];
  }

  return rows.map((row) => {
    const parts: UIPart[] = [];
    const role =
      row?.role === 'assistant' || row?.role === 'user'
        ? (row.role as 'user' | 'assistant')
        : 'assistant';
    const id = (row?.id as string) ?? '';
    const content = (row?.content as string) ?? '';
    const reasoning = (row?.reasoning as string | undefined) ?? undefined;
    if (role === 'assistant' && reasoning) {
      parts.push({ type: 'reasoning', text: reasoning });
    }
    parts.push({ type: 'text', text: content });
    return { id, role, parts } as UIMessage;
  });
}

export function useDefaultModel(
  models: Array<{ id: string }> | undefined,
  chatModelId: string,
  setChatModelId: (id: string) => void
) {
  useEffect(() => {
    if (!chatModelId && models?.length) {
      setChatModelId(models[0].id);
    }
  }, [models, chatModelId, setChatModelId]);
}

export function useHydrateInitialMessages(params: {
  threadMessages?: unknown[];
  messages: UIMessage[];
  status: string;
  initialMessages: UIMessage[];
  setMessages: (messages: UIMessage[]) => void;
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

export function useSendInitialPrompt(params: {
  initialPrompt?: string;
  initialModel?: string;
  chatModelId: string;
  threadId: string;
  sendMessage: (
    message: { text: string },
    options?: { body?: Record<string, unknown> }
  ) => void;
  setPrompt: (next: string) => void;
}) {
  const {
    initialPrompt,
    initialModel,
    chatModelId,
    threadId,
    sendMessage,
    setPrompt,
  } = params;

  useEffect(() => {
    const hasInitialPrompt = Boolean(initialPrompt);
    const hasInitialModel = Boolean(initialModel);
    if (!hasInitialPrompt) {
      return;
    }
    if (!hasInitialModel) {
      return;
    }
    if (!chatModelId) {
      return;
    }
    const text = initialPrompt ?? '';
    if (!text) {
      return;
    }
    const timeoutId = setTimeout(() => {
      sendMessage({ text }, { body: { modelId: chatModelId, threadId } });
      setPrompt('');
    }, 0);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    chatModelId,
    initialModel,
    initialPrompt,
    sendMessage,
    setPrompt,
    threadId,
  ]);
}
