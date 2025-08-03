import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { UIMessage } from "ai";
import { convertToModelMessages, streamText } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: "http://localhost:1234/v1",
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { messages } = req.body as { messages: UIMessage[] };

  const streamResult = streamText({
    model: lmstudio("liquid/lfm2-1.2b"), // or 'gpt-4o', 'gpt-3.5-turbo'
    messages: convertToModelMessages(messages),
    // optionally: tools, stopWhen, maxTokens, etc.
  });

  return streamResult.toTextStreamResponse({
    headers: {
      // Next.js uses text/event-stream automatically if needed
      "Cache-Control": "no-cache",
    },
  });
}
