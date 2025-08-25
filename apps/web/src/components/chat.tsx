import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { useAtomValue } from 'jotai';
import { modelAtom } from '@/atoms/model';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { ChatInput } from '@/components/chat-input';
import { MessagesList } from '@/components/messages-list';
import { useHydrateInitialMessages } from '@/hooks/use-chat-thread';
import { client, orpc, queryClient } from '@/utils/orpc';

interface AiChatProps {
  threadId?: string;
}

export function AiChat({ threadId }: AiChatProps) {
  const modelId = useAtomValue(modelAtom);
  const navigate = useNavigate();

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: { threadId: threadId ?? '' },
      enabled: Boolean(threadId),
    })
  );

  const { messages, status, stop, sendMessage, setMessages } = useChat({
    id: threadId,
    messages: messagesQuery.data ?? [],
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
            threadId,
          },
        };
      },
    }),
    onFinish: (message) => {
      navigate({
        to: '/chat/$id',
        params: { id: message.message.metadata?.threadId },
      });
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
    }

    sendMessage(
      { text: prompt },
      { body: { modelId, threadId: effectiveThreadId } }
    );
  };

  useHydrateInitialMessages({
    threadMessages: messagesQuery.data,
    messages,
    status,
    initialMessages: messagesQuery.data ?? [],
    setMessages,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            <MessagesList
              isLoadingAssistant={status === 'submitted'}
              messages={messages}
            />
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
