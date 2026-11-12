import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import "../../test-setup";
import { cleanup, renderHook } from "@testing-library/react";

let mockQueryData: unknown[] | undefined;
const mockRefetch = mock(() => Promise.resolve());
const mockSetMessages = mock((_msgs: unknown[]) => {
  // test spy
});

let chatMessages: unknown[] = [];
mock.module("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: chatMessages,
    status: "ready",
    stop: () => {
      // test mock
    },
    sendMessage: () => {
      // test mock
    },
    setMessages: (msgs: unknown[]) => {
      chatMessages = msgs;
      mockSetMessages(msgs);
    },
    error: undefined,
  }),
}));

const actualReactQuery = await import("@tanstack/react-query");
mock.module("@tanstack/react-query", () => ({
  ...actualReactQuery,
  useQuery: () => ({
    data: mockQueryData,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }),
}));

const actualJotai = await import("jotai");
mock.module("jotai", () => ({
  ...actualJotai,
  useAtomValue: () => "mock-token",
}));

const { useAIChat } = await import("./use-ai-chat");

describe("useAIChat hook", () => {
  beforeEach(() => {
    mockSetMessages.mockClear();
    chatMessages = [];
    mockQueryData = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it("updates messages when switching threadId", () => {
    mockQueryData = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Thread 1 message" }],
      },
    ];

    const { rerender } = renderHook(({ threadId }) => useAIChat({ threadId }), {
      initialProps: { threadId: 1 },
    });

    expect(mockSetMessages).toHaveBeenCalledWith(mockQueryData);
    mockSetMessages.mockClear();

    // Now switch threadId to 2 with different data
    mockQueryData = [
      {
        id: "2",
        role: "user",
        parts: [{ type: "text", text: "Thread 2 message" }],
      },
    ];

    rerender({ threadId: 2 });

    expect(mockSetMessages).toHaveBeenCalledWith(mockQueryData);
  });
});
