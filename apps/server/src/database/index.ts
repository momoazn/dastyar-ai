import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env, resolveConfiguredPath } from "../config";
// biome-ignore lint/performance/noNamespaceImport: GO AWAY
import * as schema from "./schema";

const databaseFile = resolveConfiguredPath(env.DATABASE_FILE);

export const sqlite = new Database(databaseFile, {
  create: true,
  strict: true,
});

export const db = drizzle({
  client: sqlite,
  schema,
});

export type {
  InsertChatThread,
  InsertCodeAssistSession,
  InsertCodeGeneration,
  InsertCodeReview,
  InsertGeneratedImage,
  InsertImageThread,
  InsertLlmModel,
  InsertMessage,
  InsertSummary,
  InsertTranslation,
  InsertUser,
  LanguageCode,
  LLMModelProvider,
  MessageRole,
  MessageStatus,
  SelectChatThread as ChatThread,
  SelectCodeAssistSession as CodeAssistSession,
  SelectCodeGeneration as CodeGeneration,
  SelectCodeReview as CodeReview,
  SelectGeneratedImage as GeneratedImage,
  SelectImageThread as ImageThread,
  SelectLlmModel as LLMModel,
  SelectMessage as Message,
  SelectSummary as Summary,
  SelectTranslation as Translation,
  SelectUser as User,
  SummaryMode,
  Tone,
  UserRole,
} from "./schema";

export const schemaExports = schema;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

// biome-ignore lint/performance/noBarrelFile: GO AWAY
export * from "./schema";
