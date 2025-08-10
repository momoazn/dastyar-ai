import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useParams,
  useRouterState,
} from '@tanstack/react-router';
import type { UIMessage } from 'ai';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatInput } from '@/components/chat-input';
import { MessagesList } from '@/components/messages-list';
import { ScrollArea } from '@/components/ui';
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

  // Default-select the first available model when none is chosen
  useEffect(() => {
    if (!chatModelId && models?.length) {
      setChatModelId(models[0].id);
    }
  }, [models, chatModelId]);

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

  const stopGenerating = useCallback(() => {
    stop();
  }, [stop]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isGenerating) {
      scrollToBottom();
    }
  }, [messages, isGenerating, scrollToBottom]);

  useSendInitialPrompt({
    initialPrompt: navigationState.initialPrompt,
    initialModel: navigationState.initialModel,
    chatModelId,
    threadId,
    sendMessage,
    setPrompt,
  });

  const renderMessages = useMemo(() => {
    return (
      <MessagesList
        isSubmitted={status === 'submitted'}
        messages={messages as UIMessage[]}
      />
    );
  }, [messages, status]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            className={`mx-auto max-w-4xl px-6 py-8 ${
              messages.length > 0 || isGenerating ? 'pb-32' : 'pb-16'
            }`}
          >
            {renderMessages}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
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
