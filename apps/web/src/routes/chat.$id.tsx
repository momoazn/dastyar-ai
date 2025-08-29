import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
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
import { ChatInput, Message } from '@/components/chat';
import type { MyUIMessage } from '@/server/utils/chat';
import { client, orpc, queryClient } from '@/utils/orpc';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const { id: threadId } = useParams({ from: '/chat/$id' });

  const modelId = useAtomValue(modelAtom);
  const isInitialRender = useRef(true);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId },
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
    if (messages.length === 0) {
      try {
        await client.threads.rename({
          id: threadId,
          title: prompt.slice(0, 10),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.threads.list.queryKey(),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to rename thread on first message', error);
      }
    }

    sendMessage({ text: prompt }, { body: { modelId, threadId } });
  };

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
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
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
