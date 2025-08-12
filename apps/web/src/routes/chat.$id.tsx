import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useParams,
  useRouterState,
} from '@tanstack/react-router';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { ChatInput } from '@/components/chat-input';
import { MessagesList } from '@/components/messages-list';
import { Alert, AlertDescription, AlertTitle, Button } from '@/components/ui';
import {
  mapThreadMessagesToUI,
  useHydrateInitialMessages,
  useSendInitialPrompt,
} from '@/hooks/use-chat-thread';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const params = useParams({ from: '/chat/$id' });
  const threadId = params.id;

  const routerState = useRouterState();
  const navigationState = (routerState.location.state ?? {}) as {
    initialPrompt?: string;
    initialModel?: string;
  };

  const [chatModelId, setChatModelId] = useState(
    navigationState.initialModel ?? ''
  );
  const [prompt, setPrompt] = useState(navigationState.initialPrompt ?? '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  const { data: models } = useQuery({
    ...orpc.models.list.queryOptions({
      input: { isEnabled: true },
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  const { data: threadMessages } = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId, order: 'asc' },
    })
  );

  // Load last selected model from localStorage when models are ready
  useEffect(() => {
    if (!models || models.length === 0) {
      return;
    }
    if (chatModelId) {
      return;
    }
    const KEY = 'ai:lastModelId';
    try {
      const saved =
        typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
      const exists = Boolean(
        saved && (models as Array<{ id: string }>).some((m) => m.id === saved)
      );
      if (exists && saved) {
        setChatModelId(saved);
        return;
      }
    } catch {
      // noop
    }
    setChatModelId((models as Array<{ id: string }>)[0].id);
  }, [models, chatModelId]);

  // Persist selected model to localStorage when valid
  useEffect(() => {
    if (!chatModelId) {
      return;
    }
    if (!models || models.length === 0) {
      return;
    }
    const exists = (models as Array<{ id: string }>).some(
      (m) => m.id === chatModelId
    );
    if (!exists) {
      return;
    }
    const KEY = 'ai:lastModelId';
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(KEY, chatModelId);
      }
    } catch {
      // noop
    }
  }, [chatModelId, models]);

  const initialMessages = useMemo(
    () => mapThreadMessagesToUI(threadMessages ?? []),
    [threadMessages]
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/chat`,
    }),
  });

  const isGenerating = status === 'streaming' || status === 'submitted';

  // Hydrate useChat state with thread messages after they load on initial mount (e.g., on page reload)
  useHydrateInitialMessages({
    threadMessages,
    messages: messages as UIMessage[],
    status,
    initialMessages,
    setMessages: setMessages as unknown as (m: UIMessage[]) => void,
  });

  const handleSendMessage = () => {
    if (!(prompt.trim() && chatModelId)) {
      return;
    }
    sendMessage({ text: prompt }, { body: { modelId: chatModelId, threadId } });
    setPrompt('');
  };

  const handleRetryLastPrompt = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return;
    }
    const parts = (lastUser.parts as { type: string; text?: string }[]) || [];
    const lastText = parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!lastText) {
      return;
    }
    if (!chatModelId) {
      return;
    }
    sendMessage(
      { text: lastText },
      { body: { modelId: chatModelId, threadId } }
    );
  };

  const stopGenerating = useCallback(() => {
    stop();
  }, [stop]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Only auto-scroll when a new message is appended (e.g., first token of assistant
  // or when the user sends a new message). Do not auto-scroll on token updates.
  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > previousMessageCountRef.current) {
      scrollToBottom();
    }
    previousMessageCountRef.current = currentCount;
  }, [messages.length, scrollToBottom]);

  useSendInitialPrompt({
    initialPrompt: navigationState.initialPrompt,
    initialModel: navigationState.initialModel,
    chatModelId,
    threadId,
    sendMessage,
    setPrompt,
  });

  const renderMessages = useMemo(() => {
    const last = (messages as UIMessage[]).at(-1);
    const isAwaitingAssistant =
      status === 'submitted' ||
      status === 'streaming' ||
      (status === 'ready' && last?.role === 'user');

    return (
      <MessagesList
        isLoadingAssistant={isAwaitingAssistant}
        messages={messages as UIMessage[]}
      />
    );
  }, [messages, status]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <Conversation>
          <ConversationContent>
            <div
              className={`mx-auto max-w-4xl px-6 py-8 ${
                messages.length > 0 || isGenerating ? 'pb-32' : 'pb-16'
              }`}
            >
              {status === 'error' ? (
                <Alert className="mb-4" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>خطا</AlertTitle>
                  <AlertDescription>
                    مشکلی در دریافت پاسخ رخ داد. لطفاً دوباره تلاش کنید.
                  </AlertDescription>
                  <div className="mt-3">
                    <Button
                      onClick={handleRetryLastPrompt}
                      size="sm"
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-3 w-3" /> تلاش مجدد
                    </Button>
                  </div>
                </Alert>
              ) : null}
              {renderMessages}
              <div ref={messagesEndRef} />
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          chatModelId={chatModelId}
          handleSendPrompt={handleSendMessage}
          isGenerating={isGenerating}
          models={models}
          prompt={prompt}
          setChatModelId={setChatModelId}
          setPrompt={setPrompt}
          stopGenerating={stopGenerating}
        />
      </div>
    </div>
  );
}
