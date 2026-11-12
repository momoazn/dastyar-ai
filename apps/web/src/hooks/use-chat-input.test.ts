import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import "../../test-setup";
import { act, cleanup, renderHook } from "@testing-library/react";

const mockNavigate = mock(() => Promise.resolve());
const mockCreateThread = mock((prompt: string) =>
  Promise.resolve({ id: 42, title: prompt })
);
let mockRenameThread = mock(() => Promise.resolve());
const mockValidatePrompt = mock((p: string) => p.trim());

const actualRouter = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...actualRouter,
  useNavigate: () => mockNavigate,
}));

mock.module("./use-chat-thread", () => ({
  useChatThread: () => ({
    createThread: mockCreateThread,
    renameThread: mockRenameThread,
    validatePrompt: mockValidatePrompt,
  }),
}));

// Import after mocking modules
const { useChatInput } = await import("./use-chat-input");

describe("useChatInput hook", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateThread.mockClear();
    mockRenameThread = mock(() => Promise.resolve());
    mockValidatePrompt.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not block sending message if auto-renaming the thread fails", async () => {
    mockRenameThread = mock(() =>
      Promise.reject(new Error("Network rename error"))
    );

    let messageSent = false;
    const onSendMessage = mock((_prompt: string) => {
      messageSent = true;
      return Promise.resolve();
    });

    const { result } = renderHook(() =>
      useChatInput({
        threadId: 10,
        renameOnSend: true,
        onSendMessage,
      })
    );

    await act(async () => {
      await result.current.handleSendPrompt("Hello world");
    });

    expect(mockRenameThread).toHaveBeenCalled();
    expect(onSendMessage).toHaveBeenCalled();
    expect(messageSent).toBe(true);
  });

  it("creates a new thread and navigates when threadId is not provided", async () => {
    const { result } = renderHook(() => useChatInput());

    await act(async () => {
      await result.current.handleSendPrompt("Starting a new conversation");
    });

    expect(mockCreateThread).toHaveBeenCalledWith(
      "Starting a new conversation"
    );
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/chat/$id",
      params: { id: "42" },
      search: { initialPrompt: "Starting a new conversation" },
    });
  });
});
