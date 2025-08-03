import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import { streamText } from "ai";
import { ollama } from "ollama-ai-provider";
import { MessagesStatusOptions, MessagesRoleOptions } from "../../types/pocketbase-types";

// Event emitter for streaming chat events
const chatEvents = new EventEmitter();

interface StreamEvent {
  type: "start" | "token" | "reasoning" | "finished" | "error";
  messageId: string;
  content?: string;
  reasoning?: string;
  error?: string;
}

export const chatRouter = createTRPCRouter({
  // Send message with streaming response
  sendMessage: publicProcedure
    .input(
      z.object({
        threadId: z.string(),
        message: z.string(),
        model: z.string().default("llama3.2:3b"),
      })
    )
    .subscription(async function* ({ ctx, input }) {
      const { threadId, message, model } = input;

      try {
        // Create user message first
        const userMessage = await ctx.pb.collection("messages").create({
          thread: threadId,
          content: message,
          role: MessagesRoleOptions.user,
          status: MessagesStatusOptions.finished,
          sentAt: new Date().toISOString(),
        });

        // Create assistant message placeholder
        const assistantMessage = await ctx.pb.collection("messages").create({
          thread: threadId,
          content: "",
          role: MessagesRoleOptions.assistant,
          model: model,
          status: MessagesStatusOptions.reasoning,
          sentAt: new Date().toISOString(),
        });

        // Get thread messages for context
        const threadMessages = await ctx.pb.collection("messages").getList(1, 50, {
          filter: `thread = "${threadId}"`,
          sort: "created",
        });

        // Convert to AI SDK format
        const messages = threadMessages.items.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content || "",
        }));

        // Stream response from Ollama
        const result = await streamText({
          model: ollama(model) as any, // Type assertion for compatibility
          messages,
        });

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        let isInReasoningMode = false;

        // Update status to streaming
        await ctx.pb.collection("messages").update(assistantMessage.id, {
          status: MessagesStatusOptions.streaming,
        });

        yield {
          type: "start" as const,
          messageId: assistantMessage.id,
        };

        // Process stream
        for await (const delta of result.textStream) {
          // Check if this is reasoning content (starts with <think> or similar patterns)
          if (delta.includes("<think>")) {
            isInReasoningMode = true;
            accumulatedReasoning += delta.replace("<think>", "");
            continue;
          }
          
          if (delta.includes("</think>")) {
            isInReasoningMode = false;
            accumulatedReasoning += delta.replace("</think>", "");
            
            // Update message with reasoning
            await ctx.pb.collection("messages").update(assistantMessage.id, {
              reasoning: accumulatedReasoning,
            });

            yield {
              type: "reasoning" as const,
              messageId: assistantMessage.id,
              reasoning: accumulatedReasoning,
            };
            continue;
          }

          if (isInReasoningMode) {
            accumulatedReasoning += delta;
            continue;
          }

          // Regular content
          accumulatedContent += delta;

          // Update message content in real-time
          await ctx.pb.collection("messages").update(assistantMessage.id, {
            content: accumulatedContent,
          });

          yield {
            type: "token" as const,
            messageId: assistantMessage.id,
            content: delta,
          };
        }

        // Mark as finished
        await ctx.pb.collection("messages").update(assistantMessage.id, {
          status: MessagesStatusOptions.finished,
          content: accumulatedContent,
        });

        // Update thread's lastMessageAt
        await ctx.pb.collection("threads").update(threadId, {
          lastMessageAt: new Date().toISOString(),
        });

        yield {
          type: "finished" as const,
          messageId: assistantMessage.id,
        };

      } catch (error) {
        console.error("Chat streaming error:", error);
        
        yield {
          type: "error" as const,
          messageId: "",
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    }),

  // Stop streaming (placeholder for implementation)
  stopStream: publicProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Update message status to stopped
      await ctx.pb.collection("messages").update(input.messageId, {
        status: MessagesStatusOptions.stopped,
      });

      return { success: true };
    }),
});