# پیوست C: نمایه پایگاه داده

شِمای پایگاه داده در فایل زیر تعریف شده است:

- `apps/server/src/database/schema/index.ts`

## گزیده شِما

```ts
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import type {
  CodeMode,
  LanguageCode,
  LLMModelProvider,
  MessageRole,
  MessageStatus,
  ProgrammingLanguage,
  SourceType,
  SummaryMode,
  Tone,
  TranslationPayload,
  UserRole,
} from "./types";
import {
  codeModes,
  languageCodes,
  llmModelProviders,
  messageRoles,
  messageStatuses,
  programmingLanguages,
  sourceTypes,
  summaryModes,
  tones,
  userRoles,
} from "./types";

// ============================================================================
// Helpers
// ============================================================================

const timestamp = sql`(unixepoch())`;

// ============================================================================
// Tables
// ============================================================================

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles })
    .$type<UserRole>()
    .notNull()
    .default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(timestamp),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(timestamp),
});

export const llmModels = sqliteTable(
  "llm_models",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    identifier: text("identifier").notNull(),
    provider: text("provider", { enum: llmModelProviders })
      .$type<LLMModelProvider>()
      .notNull(),
    creator: text("creator"),
    family: text("family"),
    size: text("size"),
    isEnabled: integer("is_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [
    index("idx_llm_models_provider_identifier").on(
      table.provider,
      table.identifier
    ),
  ]
);

export const ollamaServers = sqliteTable(
  "ollama_servers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    baseUrl: text("base_url").notNull().unique(),
    isEnabled: integer("is_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [index("idx_ollama_servers_enabled").on(table.isEnabled)]
);

export const ollamaServerModels = sqliteTable(
  "ollama_server_models",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    serverId: integer("server_id")
      .notNull()
      .references(() => ollamaServers.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    modelIdentifier: text("model_identifier").notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [
    index("idx_ollama_server_models_server_id").on(table.serverId),
    index("idx_ollama_server_models_identifier").on(table.modelIdentifier),
    uniqueIndex("uidx_ollama_server_models_server_identifier").on(
      table.serverId,
      table.modelIdentifier
    ),
  ]
);

export const chatThreads = sqliteTable(
  "chat_threads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [
    index("idx_chat_threads_user_id").on(table.userId),
    index("idx_chat_threads_last_message_at").on(table.lastMessageAt),
  ]
);

export const messages = sqliteTable(
  "messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    parts: text("parts", { mode: "json" }).notNull(),
    status: text("status", { enum: messageStatuses })
      .$type<MessageStatus>()
      .notNull(),
    role: text("role", { enum: messageRoles }).$type<MessageRole>().notNull(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => chatThreads.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    modelId: integer("model_id")
      .notNull()
      .references(() => llmModels.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [
    index("idx_messages_thread_id").on(table.threadId),
    index("idx_messages_user_id").on(table.userId),
  ]
);

export const translations = sqliteTable(
  "translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceText: text("source_text").notNull(),
    translatedText: text("translated_text"),
    sourceLanguage: text("source_language", { enum: languageCodes })
      .$type<LanguageCode>()
      .notNull(),
    targetLanguage: text("target_language", { enum: languageCodes })
      .$type<LanguageCode>()
      .notNull(),
    tone: text("tone", { enum: tones }).$type<Tone>(),
    sourceType: text("source_type", { enum: sourceTypes })
      .$type<SourceType>()
      .notNull()
      .default("text"),
    sourceFileName: text("source_file_name"),
    payload: text("payload", {
      mode: "json",
    }).$type<TranslationPayload | null>(),
    modelId: integer("model_id")
      .notNull()
      .references(() => llmModels.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [index("idx_translations_user_id").on(table.userId)]
);

export const summaries = sqliteTable(
  "summaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceText: text("source_text").notNull(),
    summaryText: text("summary_text"),
    mode: text("mode", { enum: summaryModes }).$type<SummaryMode>().notNull(),
    tone: text("tone", { enum: tones }).$type<Tone>(),
    modelId: integer("model_id")
      .notNull()
      .references(() => llmModels.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
```

## نکته

برای مستندسازی کامل‌تر، می‌توان یک Data Dictionary (شرح فیلدها، قیود و روابط) تولید کرد. در نسخه حاضر، هدف ارائه یک نمای قابل بررسی و قابل بازتولید از منبع حقیقت (Source of Truth) است.
