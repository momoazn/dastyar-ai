import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { demoAnswer } from "./answers";
import { addMessage } from "./client";

type ChatBody = {
  threadId: string;
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>;
};

const WORD_BOUNDARY = /(?<=\s)/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Stands in for POST /api/chat: saves the turn and streams a canned answer.
export const demoChatFetch = (
  _url: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const body = JSON.parse(String(init?.body)) as ChatBody;
  const threadId = Number(body.threadId);
  const last = body.messages.at(-1);
  const prompt =
    last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  const answer = demoAnswer(prompt);
  addMessage(threadId, "user", prompt);

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const id = "demo-text";
      writer.write({ type: "text-start", id });
      for (const word of answer.split(WORD_BOUNDARY)) {
        writer.write({ type: "text-delta", id, delta: word });
        await sleep(25);
      }
      writer.write({ type: "text-end", id });
      addMessage(threadId, "assistant", answer);
    },
  });
  return Promise.resolve(createUIMessageStreamResponse({ stream }));
};
