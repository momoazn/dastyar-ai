import { Message, sendMessage as sendMessageApi } from "@/lib/api/chat";
import { Dispatch, SetStateAction, useState } from "react";

export const useChat = (
  messages: Message[],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  threadID: number,
) => {
  // const queryClient = useQueryClient();

  const [isStreaming, setIsStreaming] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMessage: Partial<Message> = {
      id: Math.random(),
      role: "user",
      content: content.trim(),
      model: "deepscaler:latest",
    };

    const assistantMessage: Partial<Message> = {
      id: Math.random(),
      role: "assistant",
      content: "",
      think: "",
      model: "deepscaler:latest",
      state: "idle",
    };

    // queryClient.setQueryData<PaginatedApiResponse<Message>>(
    //   getThreadMessagesQueryKey(threadID),
    //   (prev) => {
    //     if (!prev) return prev;

    //     return {
    //       ...prev,
    //       data: [
    //         ...prev.data,
    //         userMessage as Message,
    //         assistantMessage as Message,
    //       ],
    //     };
    //   },
    // );

    setMessages([
      ...messages,
      userMessage as Message,
      assistantMessage as Message,
    ]);

    setIsStreaming(true);
    setStopRequested(false);

    let fullContent = "";
    let fullThink = "";

    await sendMessageApi(
      threadID,
      userMessage.content!,
      "deepscaler:latest",
      (chunk) => {
        if (stopRequested) return;

        // queryClient.setQueryData<PaginatedApiResponse<Message>>(
        //   getThreadMessagesQueryKey(threadID),
        //   (prev) => {
        //     if (!prev) return prev;

        //     const newMessages = [...prev.data];
        //     newMessages[newMessages.length - 1].content += chunk.content;
        //     return {
        //       ...prev,
        //       data: newMessages,
        //     };
        //   },
        // );

        if (chunk.state === "thinking") {
          fullThink += chunk.think ?? "";
        } else if (chunk.state === "responding") {
          fullContent += chunk.content ?? "";
        }

        const newMessage: Message = {
          ...chunk,
          content: fullContent,
          think: fullThink,
        };

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = newMessage;
          return newMessages;
        });
      },
      () => {
        setIsStreaming(false);
      },
    );
  };

  const stopStreaming = () => {
    setStopRequested(true);
    setIsStreaming(false);
  };

  return {
    isStreaming,
    sendMessage,
    stopStreaming,
  };
};
