import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { providers, systemPrompt } from "@/server/providers";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: providers.lmStudio("liquid/lfm2-1.2b"),
    messages: convertToModelMessages(messages),
    system: systemPrompt,
  });

  return result.toUIMessageStreamResponse();
}
