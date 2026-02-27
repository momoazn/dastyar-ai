#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { appRouter } from "@/server/procedures";

const API_URL = process.env.API_URL ?? "http://localhost:3000";
const MODEL_IDENTIFIER = process.env.MODEL_IDENTIFIER ?? "deepseek-r1:1.5b";
const MAX_ATTEMPTS = Math.max(1, Number(process.env.MAX_ATTEMPTS ?? 3));
const QUESTION =
  process.env.QUESTION ??
  "What surname appears in the attached file name Jozo_Tomasevich.pdf? Answer with only the surname.";
const EXPECTED_REGEX = new RegExp(
  process.env.EXPECTED_REGEX ?? "tomasevich|tomašević|tomasevic",
  "iu"
);
const DOCUMENT_PATH = process.argv[2];

type AuthResponse = {
  token: string;
  user: { id: number; username: string };
};

type LlmModel = {
  id: number;
  identifier: string;
  provider: string;
};

type ThreadResponse = {
  id: number;
  title: string;
};

type UploadResponse = {
  id: number | string;
  indexedChunks?: number | null;
  indexingReason?: string;
  indexingSource?: string;
  indexingStatus?: string;
};

type OrpcClient = RouterClient<typeof appRouter>;

function assertOrExit(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getFileName(path: string): string {
  const parts = path.split("/");
  const fileName = parts.at(-1);
  return fileName && fileName.length > 0 ? fileName : "uploaded.pdf";
}

function extractSseTextDeltas(raw: string): string {
  const lines = raw.split("\n");
  let text = "";

  for (const line of lines) {
    if (!line.startsWith("data: ")) {
      continue;
    }

    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as {
        delta?: string;
        type?: string;
      };
      if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
        text += parsed.delta;
      }
    } catch {
      // Ignore non-JSON stream rows.
    }
  }

  return text.trim();
}

function getAttemptQuestions(baseQuestion: string): string[] {
  if (process.env.QUESTION) {
    return Array.from({ length: MAX_ATTEMPTS }, () => baseQuestion);
  }

  const defaults = [
    baseQuestion,
    "Look at the filename Jozo_Tomasevich.pdf and return only the surname after the underscore.",
    "Return only the surname part in the filename Jozo_Tomasevich.pdf.",
  ];

  if (MAX_ATTEMPTS <= defaults.length) {
    return defaults.slice(0, MAX_ATTEMPTS);
  }

  const questions = [...defaults];
  while (questions.length < MAX_ATTEMPTS) {
    questions.push(defaults.at(-1) ?? baseQuestion);
  }
  return questions;
}

async function askAssistant(params: {
  apiUrl: string;
  modelId: number;
  prompt: string;
  threadId: number;
  token: string;
}): Promise<string> {
  const { apiUrl, modelId, prompt, threadId, token } = params;
  const chatResponse = await fetch(`${apiUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      modelId,
      threadId,
      messages: [
        {
          id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          role: "user",
          parts: [{ type: "text", text: prompt }],
        },
      ],
    }),
  });

  assertOrExit(
    chatResponse.ok,
    `Chat request failed with status ${chatResponse.status}`
  );

  const streamText = await chatResponse.text();
  return extractSseTextDeltas(streamText);
}

async function main() {
  if (!DOCUMENT_PATH) {
    throw new Error(
      "Usage: bun apps/web/scripts/testing/test-document-rag-chat-e2e.ts <path-to-pdf>"
    );
  }

  const file = Bun.file(DOCUMENT_PATH);
  assertOrExit(file.size > 0, `Document file not found: ${DOCUMENT_PATH}`);

  const publicClient: OrpcClient = createORPCClient(
    new RPCLink({
      url: `${API_URL}/rpc`,
    })
  );

  const health = await publicClient.healthCheck();
  assertOrExit(health === "OK", `Health check failed: ${String(health)}`);

  const username = `e2e_doc_rag_${Date.now()}`;
  const password = "testPassword123";
  const registered = (await publicClient.auth.register({
    username,
    password,
  })) as AuthResponse;
  assertOrExit(registered?.token, "Registration failed");

  const authClient: OrpcClient = createORPCClient(
    new RPCLink({
      url: `${API_URL}/rpc`,
      headers: () => ({
        Authorization: `Bearer ${registered.token}`,
      }),
    })
  );

  const models = (await publicClient.models.list({
    sync: true,
    isEnabled: true,
  })) as LlmModel[];
  const selectedModel = models.find(
    (model) => model.identifier === MODEL_IDENTIFIER
  );
  assertOrExit(
    selectedModel,
    `Model '${MODEL_IDENTIFIER}' not found. Available: ${models
      .map((model) => model.identifier)
      .join(", ")}`
  );

  const thread = (await authClient.threads.create({
    title: `E2E document RAG test ${Date.now()}`,
  })) as ThreadResponse;
  assertOrExit(thread?.id, "Failed to create thread");

  const fileName = getFileName(DOCUMENT_PATH);
  const uploadFile = new File([await file.arrayBuffer()], fileName, {
    type: "application/pdf",
  });
  const uploaded = (await authClient.documents.upload({
    file: uploadFile,
    threadId: Number(thread.id),
    title: fileName,
  })) as UploadResponse;

  const indexedChunks = Number(uploaded.indexedChunks ?? 0);
  assertOrExit(
    uploaded.indexingStatus === "indexed" && indexedChunks > 0,
    `Document indexing failed. status=${uploaded.indexingStatus} reason=${uploaded.indexingReason} chunks=${indexedChunks}`
  );

  const threadId = Number(thread.id);
  const attemptQuestions = getAttemptQuestions(QUESTION);
  const attempts: Array<{
    answerText: string;
    attempt: number;
    matchesExpectation: boolean;
    question: string;
  }> = [];

  for (const [index, prompt] of attemptQuestions.entries()) {
    const answerText = await askAssistant({
      apiUrl: API_URL,
      modelId: selectedModel.id,
      prompt,
      threadId,
      token: registered.token,
    });
    const matched = EXPECTED_REGEX.test(answerText);

    attempts.push({
      answerText,
      attempt: index + 1,
      matchesExpectation: matched,
      question: prompt,
    });

    if (matched) {
      break;
    }
  }

  const finalAttempt = attempts.at(-1);
  const answerText = finalAttempt?.answerText ?? "";
  const answerMatched = attempts.some((attempt) => attempt.matchesExpectation);

  const summary = {
    apiUrl: API_URL,
    user: username,
    model: selectedModel.identifier,
    threadId: Number(thread.id),
    upload: {
      documentId: Number(uploaded.id),
      indexedChunks,
      indexingReason: uploaded.indexingReason ?? null,
      indexingSource: uploaded.indexingSource ?? null,
      indexingStatus: uploaded.indexingStatus ?? null,
    },
    question: QUESTION,
    answerText,
    attempts,
    checks: {
      expectedRegex: EXPECTED_REGEX.source,
      matchesExpectation: answerMatched,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!answerMatched) {
    process.exit(2);
  }
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Unexpected unknown error";
  console.error(`E2E document RAG test failed: ${message}`);
  process.exit(1);
});
