import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useParams,
  useRouterState,
} from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssistantMessage } from '@/components/assistant-message';
import { ChatInput } from '@/components/chat-input';
import { NoMessages } from '@/components/no-messages';
import { ScrollArea } from '@/components/ui';
import { UserMessage } from '@/components/user-message';
import { PERSIAN_TEXTS } from '@/lib/persian-texts';
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

  // chatModel stores models row id
  const [chatModel, setChatModel] = useState(
    navigationState.initialModel || ''
  );
  const [prompt, setPrompt] = useState(navigationState.initialPrompt || '');
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
    if (!chatModel && models?.length) {
      setChatModel(models[0].id);
    }
  }, [models, chatModel]);

  const initialMessages = useMemo(() => {
    if (!threadMessages || threadMessages.length === 0) {
      return [];
    }
    return threadMessages.map((m) => {
      const parts: Array<
        { type: 'text'; text: string } | { type: 'reasoning'; text: string }
      > = [];
      if (m.role === 'assistant' && m.reasoning) {
        parts.push({ type: 'reasoning', text: m.reasoning as string });
      }
      parts.push({ type: 'text', text: (m.content as string) ?? '' });
      return {
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        parts,
      } as const;
    });
  }, [threadMessages]);

  // Keep a stable chat id across data loads to prevent resetting the stream state
  const chatId = useMemo(() => `${threadId}`, [threadId]);

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/chat`,
      body: () => {
        const row = (models || []).find((m) => m.id === chatModel);
        return { modelId: row?.modelId, threadId };
      },
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  const handleSendMessage = useCallback(() => {
    if (!(prompt.trim() && chatModel)) {
      return;
    }
    sendMessage({ text: prompt });
    setPrompt('');
  }, [prompt, chatModel, sendMessage]);

  const stopStreaming = useCallback(() => {
    stop();
  }, [stop]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      scrollToBottom();
    }
  }, [messages, isStreaming, scrollToBottom]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages
  useEffect(() => {
    if (navigationState.initialPrompt && navigationState.initialModel) {
      // Submit the initial prompt once on mount, then clear the input value
      setTimeout(() => {
        // biome-ignore lint/style/noNonNullAssertion: navigationState.initialPrompt is not null
        sendMessage({ text: navigationState.initialPrompt! });
        setPrompt('');
      }, 0);
    }
  }, []);

  const renderMessages = useMemo(() => {
    if (messages.length > 0) {
      const parsed = messages.map((m) => {
        let text = '';
        let reasoning = '';
        for (const p of m.parts) {
          if (p.type === 'text') {
            text += p.text;
          }
          if (p.type === 'reasoning') {
            reasoning += p.text;
          }
        }
        return { id: m.id, role: m.role, text, reasoning };
      });

      return (
        <div className="space-y-4">
          {parsed.map((m) =>
            m.role === 'user' ? (
              <UserMessage
                key={m.id}
                message={{ role: 'user', content: m.text }}
              />
            ) : (
              <AssistantMessage
                key={m.id}
                message={{
                  role: 'assistant',
                  content: m.text,
                  reasoning: m.reasoning,
                }}
              />
            )
          )}
        </div>
      );
    }

    if (isStreaming) {
      return (
        <div className="flex h-32 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              {PERSIAN_TEXTS.general.loading}...
            </span>
          </div>
        </div>
      );
    }

    return <NoMessages className="min-h-[65vh] md:min-h-[75vh]" />;
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            className={`mx-auto max-w-4xl px-6 py-8 ${
              messages.length > 0 || isStreaming ? 'pb-32' : 'pb-16'
            }`}
          >
            {renderMessages}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {isStreaming ? (
          <output aria-live="polite" className="border-border/60 border-t">
            <div className="mx-auto max-w-4xl px-6 py-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{PERSIAN_TEXTS.general.loading}...</span>
              </div>
            </div>
          </output>
        ) : null}
        <ChatInput
          chatModel={chatModel}
          handleSendPrompt={handleSendMessage}
          isStreaming={isStreaming}
          models={models}
          prompt={prompt}
          setChatModel={setChatModel}
          setPrompt={setPrompt}
          stopStreaming={stopStreaming}
        />
      </div>
    </div>
  );
}
