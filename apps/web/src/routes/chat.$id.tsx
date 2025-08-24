import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { ChatInput } from '@/components/chat-input';
import { MessagesList } from '@/components/messages-list';
import { useHydrateInitialMessages } from '@/hooks/use-chat-thread';
import { orpc } from '@/utils/orpc';
import { initialPromptAtom } from '../../atoms/initial-prompt';
import { modelAtom } from '../../atoms/model';

export const Route = createFileRoute('/chat/$id')({
  component: ChatThreadRouteComponent,
});

function ChatThreadRouteComponent() {
  const { id: threadId } = useParams({ from: '/chat/$id' });
  const [initialPrompt, setInitialPrompt] = useAtom(initialPromptAtom);
  const modelId = useAtomValue(modelAtom);

  const messagesQuery = useQuery(
    orpc.messages.listByThread.queryOptions({
      input: {
        threadId,
      },
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
  });

  const handleSendPrompt = (prompt: string) => {
    sendMessage({ text: prompt }, { body: { modelId } });
  };

  useHydrateInitialMessages({
    threadMessages: messagesQuery.data,
    messages,
    status,
    initialMessages: messagesQuery.data ?? [],
    setMessages,
  });

  useEffect(() => {
    if (initialPrompt.prompt && !initialPrompt.isUsed) {
      handleSendPrompt(initialPrompt.prompt);
      setInitialPrompt({ ...initialPrompt, isUsed: true });
    }
  }, [initialPrompt]);

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
          stopGenerating={stop}
        />
      </div>
    </div>
  );
}
