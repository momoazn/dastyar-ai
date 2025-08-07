import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Language enums
export const LanguageEnum = {
  PERSIAN: "fa",
  ENGLISH: "en",
  ARABIC: "ar",
  FRENCH: "fr",
  GERMAN: "de",
  SPANISH: "es",
  ITALIAN: "it",
  PORTUGUESE: "pt",
  RUSSIAN: "ru",
  CHINESE: "zh",
  JAPANESE: "ja",
  KOREAN: "ko",
  TURKISH: "tr",
  HINDI: "hi",
  URDU: "ur",
} as const;

export type Language = (typeof LanguageEnum)[keyof typeof LanguageEnum];

// Tone enums
export const ToneEnum = {
  FORMAL: "formal",
  INFORMAL: "informal",
  BUSINESS: "business",
  CASUAL: "casual",
  ACADEMIC: "academic",
  TECHNICAL: "technical",
  CREATIVE: "creative",
  FRIENDLY: "friendly",
  PROFESSIONAL: "professional",
} as const;

export type Tone = (typeof ToneEnum)[keyof typeof ToneEnum];

// Status enums for messages
export const MessageStatusEnum = {
  IDLE: "idle",
  REASONING: "reasoning",
  STREAMING: "streaming",
  FINISHED: "finished",
  ERRORED: "errored",
  STOPPED: "stopped",
} as const;

export type MessageStatus =
  (typeof MessageStatusEnum)[keyof typeof MessageStatusEnum];

// Role enums for messages
export const MessageRoleEnum = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export type MessageRole =
  (typeof MessageRoleEnum)[keyof typeof MessageRoleEnum];

/*
  Threads table – represents a chat thread 
*/
export const threads = sqliteTable("threads", {
  id: text("id", { length: 15 }).primaryKey().notNull(),
  title: text("title").notNull(),
  isArchived: integer("isArchived", { mode: "boolean" })
    .notNull()
    .default(false),
  lastMessageAt: integer("lastMessageAt", { mode: "timestamp" }),
  createdAt: integer("created", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

/*
  Messages table – individual messages inside a thread
*/
export const messages = sqliteTable("messages", {
  id: text("id", { length: 15 }).primaryKey().notNull(),
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  status: text("status", {
    enum: Object.values(MessageStatusEnum) as [string, ...string[]],
  }),
  role: text("role", {
    enum: Object.values(MessageRoleEnum) as [string, ...string[]],
  }),
  model: text("model"),
  sentAt: integer("sentAt", { mode: "timestamp" }),
  threadId: text("thread")
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  createdAt: integer("created", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
}));

/*
  Translations table – stores translation jobs & results
*/
export const translations = sqliteTable("translations", {
  id: text("id", { length: 15 }).primaryKey().notNull(),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText"),
  model: text("model").notNull(),
  sourceLanguage: text("sourceLanguage", {
    enum: Object.values(LanguageEnum) as [string, ...string[]],
  }).notNull(),
  targetLanguage: text("targetLanguage", {
    enum: Object.values(LanguageEnum) as [string, ...string[]],
  }).notNull(),
  tone: text("tone", {
    enum: Object.values(ToneEnum) as [string, ...string[]],
  }),
  createdAt: integer("created", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer("updated", { mode: "timestamp" }).default(
    sql`(unixepoch())`
  ),
});
