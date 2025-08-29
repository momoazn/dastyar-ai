import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { modelAtom } from '@/atoms/model';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { ChatInput } from '@/components/chat-input';
import { Message } from '@/components/message';
import type { MyUIMessage } from '@/server/utils/chat';
import { client, orpc, queryClient } from '@/utils/orpc';

interface AiChatProps {
  threadId?: string;
  initialPrompt?: string;
}

export function AiChat({ threadId, initialPrompt }: AiChatProps) {
  const modelId = useAtomValue(modelAtom);
  const navigate = useNavigate();
  const isInitialRender = useRef(true);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId: threadId ?? '' },
      enabled: Boolean(threadId),
    })
  );

  const { messages, status, stop, sendMessage, setMessages } =
    useChat<MyUIMessage>({
      id: threadId,
      transport: new DefaultChatTransport({
        api: `${import.meta.env.VITE_SERVER_URL}/chat`,
        prepareSendMessagesRequest: ({ messages: _messages, body }) => {
          const lastMessage = _messages.at(-1);
          if (!lastMessage) {
            throw new Error('No last message');
          }
          return {
            body: {
              ...body,
              message: lastMessage,
            },
          };
        },
      }),
      onFinish: () => {
        messagesQuery.refetch();
      },
    });

  const lastUsedModelId = messagesQuery.data?.at(-1)?.metadata?.modelId;

  const handleSendPrompt = async (prompt: string) => {
    let effectiveThreadId = threadId;
    if (!effectiveThreadId) {
      const created = await client.threads.create({
        title: prompt.slice(0, 10),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.threads.list.queryKey(),
      });
      effectiveThreadId = created.id;
      navigate({
        to: '/chat/$id',
        params: { id: created.id },
        search: { prompt },
      });
      return; // stream will be initiated on the thread page
    }

    sendMessage(
      { text: prompt },
      { body: { modelId, threadId: effectiveThreadId } }
    );
  };

  // If we navigated here with an initial prompt (new thread), send it now and clear the search param
  // to avoid duplicate sends on re-renders.
  const lastSentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key =
      threadId && initialPrompt ? `${threadId}:${initialPrompt}` : null;
    if (
      threadId &&
      initialPrompt &&
      status === 'ready' &&
      messages.length === 0 &&
      key !== lastSentKeyRef.current
    ) {
      lastSentKeyRef.current = key;
      sendMessage({ text: initialPrompt }, { body: { modelId, threadId } });
      navigate({
        to: '/chat/$id',
        params: { id: threadId },
        search: { prompt: undefined },
      });
    }
  }, [
    threadId,
    initialPrompt,
    status,
    messages.length,
    modelId,
    sendMessage,
    navigate,
  ]);

  useEffect(() => {
    if (isInitialRender.current && messagesQuery.data) {
      setMessages([...messagesQuery.data]);
      isInitialRender.current = false;
    }
  }, [messagesQuery.data, setMessages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              const isLast = idx === messages.length - 1;
              const msgStatus = isLast ? status : undefined;

              return (
                <div className={isUser ? 'flex justify-end' : ''} key={m.id}>
                  <Message message={m} status={msgStatus} />
                </div>
              );
            })}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          handleSendPrompt={handleSendPrompt}
          isGenerating={status === 'streaming' || status === 'submitted'}
          lastUsedModelId={lastUsedModelId ?? undefined}
          stopGenerating={stop}
        />
      </div>
    </div>
  );
}
