import { generateText, type LanguageModel } from "ai";
import type { LLMModel, LLMModelProvider } from "@/database";
import { logger } from "@/lib/logger";
import { getModels } from "@/repositories/llm-models";
import { getThread, renameThread } from "@/repositories/threads";
import { acquireProviderForModel } from "./ai-providers";

const DEFAULT_CHAT_TITLE = "گفتگوی جدید";
const TITLE_MAX_LENGTH = 60;
const TITLE_SOURCE_MAX_LENGTH = 1200;
const TITLE_MODEL_UNKNOWN_SIZE_SCORE = Number.MAX_SAFE_INTEGER;
const TITLE_SIZE_REGEX = /^([0-9.]+)([a-z]+)$/i;
const TITLE_MODEL_PROVIDERS = new Set<LLMModelProvider>(["lmstudio", "ollama"]);
const EXCLUDED_MODEL_IDENTIFIER_PARTS = [
  "embed",
  "embedding",
  "whisper",
  "stable-diffusion",
] as const;
const TITLE_EDGE_CHARS_REGEX =
  /^[\s"'`«»“”‘’[\]{}().,،:؛;!?؟-]+|[\s"'`«»“”‘’[\]{}().,،:؛;!?؟-]+$/gu;
const TITLE_WHITESPACE_REGEX = /\s+/gu;

type TitleModelCandidate = Pick<
  LLMModel,
  "id" | "identifier" | "isEnabled" | "provider" | "size"
>;

export function isDefaultChatTitle(title: string): boolean {
  return title.trim() === DEFAULT_CHAT_TITLE;
}

function sizeToMillions(size: string | null | undefined): number {
  if (!size) {
    return TITLE_MODEL_UNKNOWN_SIZE_SCORE;
  }

  const match = size.trim().toLowerCase().match(TITLE_SIZE_REGEX);
  if (!match) {
    return TITLE_MODEL_UNKNOWN_SIZE_SCORE;
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value)) {
    return TITLE_MODEL_UNKNOWN_SIZE_SCORE;
  }
  if (unit === "m" || unit === "million") {
    return value;
  }
  if (unit === "b" || unit === "billion") {
    return value * 1000;
  }

  return TITLE_MODEL_UNKNOWN_SIZE_SCORE;
}

function isTitleModelCandidate(model: TitleModelCandidate): boolean {
  if (!(model.isEnabled && TITLE_MODEL_PROVIDERS.has(model.provider))) {
    return false;
  }

  const identifier = model.identifier.toLowerCase();
  return !EXCLUDED_MODEL_IDENTIFIER_PARTS.some((part) =>
    identifier.includes(part)
  );
}

export function pickSmallestTitleModel<T extends TitleModelCandidate>(
  models: T[]
): T | null {
  const candidates = models.filter(isTitleModelCandidate);
  candidates.sort((left, right) => {
    const sizeDelta = sizeToMillions(left.size) - sizeToMillions(right.size);
    if (sizeDelta !== 0) {
      return sizeDelta;
    }
    return left.id - right.id;
  });

  return candidates.at(0) ?? null;
}

export function sanitizeGeneratedTitle(rawTitle: string): string | null {
  const title = rawTitle
    .replace(TITLE_WHITESPACE_REGEX, " ")
    .trim()
    .replace(TITLE_EDGE_CHARS_REGEX, "")
    .slice(0, TITLE_MAX_LENGTH)
    .trim()
    .replace(TITLE_EDGE_CHARS_REGEX, "");

  return title.length > 0 ? title : null;
}

export function buildChatTitlePrompt(userText: string): {
  prompt: string;
  system: string;
} {
  const source = userText.trim().slice(0, TITLE_SOURCE_MAX_LENGTH);
  return {
    system:
      "Create a short Persian title for a chat thread. Max 5 words. No quotes. No punctuation. Return only the title.",
    prompt: `User message:\n${source}`,
  };
}

async function generateTitleWithModel(params: {
  model: LanguageModel;
  userText: string;
}): Promise<string | null> {
  const { prompt, system } = buildChatTitlePrompt(params.userText);
  const result = await generateText({
    model: params.model,
    prompt,
    system,
    temperature: 0.1,
  });

  return sanitizeGeneratedTitle(result.text);
}

export async function generateChatTitle(
  userText: string
): Promise<string | null> {
  const models = await getModels({ isEnabled: true });
  const titleModel = pickSmallestTitleModel(models);
  if (!titleModel) {
    return null;
  }

  const providerLease = await acquireProviderForModel(
    titleModel.identifier,
    titleModel.provider
  );
  try {
    return await generateTitleWithModel({
      model: providerLease.model,
      userText,
    });
  } finally {
    providerLease.release();
  }
}

export function generateChatTitleBestEffort(params: {
  threadId: number;
  userId: number;
  userText: string;
}): void {
  async function generateAndRename() {
    try {
      if (!params.userText.trim()) {
        return;
      }

      const thread = await getThread(params.threadId, params.userId);
      if (!(thread && isDefaultChatTitle(thread.title))) {
        return;
      }

      const title = await generateChatTitle(params.userText);
      if (!title) {
        return;
      }

      await renameThread(params.threadId, title, params.userId);
    } catch (error) {
      logger.error("Chat title generation failed", error, {
        threadId: params.threadId,
        userId: params.userId,
      });
    }
  }

  generateAndRename().catch((error) => {
    logger.error("Chat title generation scheduling failed", error, {
      threadId: params.threadId,
      userId: params.userId,
    });
  });
}
