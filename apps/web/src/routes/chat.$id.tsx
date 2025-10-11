import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { MessageCircleIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useChatModelSelection } from '@/hooks/use-feature-model-selection';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { ChatInput, Message } from '@/components/chat';
import { fa } from '@/lib/persian-texts';
import type { MyUIMessage } from '@/server/utils/chat';
import { client, orpc, queryClient } from '@/utils/orpc';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const { id: threadId } = useParams({ from: '/chat/$id' });

  const { modelId } = useChatModelSelection({ threadId: Number(threadId) });
  const isInitialRender = useRef(true);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId: Number(threadId) },
    })
  );

  const { messages, status, stop, sendMessage, setMessages } =
    useChat<MyUIMessage>({
      id: threadId,
      transport: new DefaultChatTransport({
        api: `${import.meta.env.VITE_SERVER_URL}/api/chat`,
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

  const handleSendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    if (messages.length === 0) {
      try {
        await client.threads.rename({
          id: Number(threadId),
          title: trimmed.slice(0, 10),
        });
        await queryClient.invalidateQueries({
          queryKey: orpc.threads.list.queryKey(),
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to rename thread on first message', error);
      }
    }

    sendMessage({ text: trimmed }, { body: { modelId, threadId } });
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
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessageCircleIcon className="size-10" />
            <div className="space-y-1" dir="rtl">
              <div className="font-medium">{fa.chat.askQuestion}</div>
              <div className="text-xs">{fa.chat.askQuestionDescription}</div>
            </div>
          </div>
        ) : (
          <Conversation className="h-full">
            <ConversationContent>
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {status === 'submitted' && <Loader />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}
      </div>

      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <ChatInput
          handleSendPrompt={handleSendPrompt}
          isGenerating={status === 'streaming' || status === 'submitted'}
          stopGenerating={stop}
          threadId={Number(threadId)}
        />
      </div>
    </div>
  );
}
