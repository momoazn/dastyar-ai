import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

// Language enums
export const LanguageEnum = {
  PERSIAN: 'fa',
  ENGLISH: 'en',
  ARABIC: 'ar',
  FRENCH: 'fr',
  GERMAN: 'de',
  SPANISH: 'es',
  ITALIAN: 'it',
  PORTUGUESE: 'pt',
  RUSSIAN: 'ru',
  CHINESE: 'zh',
  JAPANESE: 'ja',
  KOREAN: 'ko',
  TURKISH: 'tr',
  HINDI: 'hi',
  URDU: 'ur',
} as const;

export type Language = (typeof LanguageEnum)[keyof typeof LanguageEnum];

// Tone enums
export const ToneEnum = {
  FORMAL: 'formal',
  INFORMAL: 'informal',
  BUSINESS: 'business',
  CASUAL: 'casual',
  ACADEMIC: 'academic',
  TECHNICAL: 'technical',
  CREATIVE: 'creative',
  FRIENDLY: 'friendly',
  PROFESSIONAL: 'professional',
} as const;

export type Tone = (typeof ToneEnum)[keyof typeof ToneEnum];

// Status enums for messages
export const MessageStatusEnum = {
  IDLE: 'idle',
  REASONING: 'reasoning',
  STREAMING: 'streaming',
  FINISHED: 'finished',
  ERRORED: 'errored',
  STOPPED: 'stopped',
} as const;

export type MessageStatus =
  (typeof MessageStatusEnum)[keyof typeof MessageStatusEnum];

// Role enums for messages
export const MessageRoleEnum = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type MessageRole =
  (typeof MessageRoleEnum)[keyof typeof MessageRoleEnum];

// Provider enums for AI models
export const ModelProviderEnum = {
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  MISTRAL: 'mistral',
  OPENROUTER: 'openrouter',
  REQUESTY: 'requesty',
} as const;

export type ModelProvider =
  (typeof ModelProviderEnum)[keyof typeof ModelProviderEnum];

/*
  Models table – stores metadata about available AI models
*/
export const models = sqliteTable(
  'models',
  {
    id: text('id', { length: 15 }).primaryKey().notNull(),
    name: text('name').notNull(),
    provider: text('provider', {
      enum: Object.values(ModelProviderEnum) as [string, ...string[]],
    }).notNull(),
    description: text('description'),
    contextWindow: integer('contextWindow'),
    isEnabled: integer('isEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    isVisionCapable: integer('isVisionCapable', { mode: 'boolean' })
      .notNull()
      .default(false),
    isReasoningCapable: integer('isReasoningCapable', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('created', { mode: 'timestamp' }).default(
      sql`(unixepoch())`
    ),
    updatedAt: integer('updated', { mode: 'timestamp' }).default(
      sql`(unixepoch())`
    ),
  },
  (table) => [
    // Ensure (provider, name) is unique to allow ON CONFLICT upserts
    uniqueIndex('models_provider_name_uq').on(table.provider, table.name),
  ]
);

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

// Drizzle-Zod schemas for models (no overrides)
export const insertModelSchema = createInsertSchema(models);
export const selectModelSchema = createSelectSchema(models);

export type InsertModelInput = z.infer<typeof insertModelSchema>;
export type SelectModelOutput = z.infer<typeof selectModelSchema>;

/*
  Threads table – represents a chat thread 
*/
export const threads = sqliteTable('threads', {
  id: text('id', { length: 15 }).primaryKey().notNull(),
  title: text('title').notNull(),
  isArchived: integer('isArchived', { mode: 'boolean' })
    .notNull()
    .default(false),
  lastMessageAt: integer('lastMessageAt', { mode: 'timestamp' }),
  createdAt: integer('created', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer('updated', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

export const insertThreadSchema = createInsertSchema(threads);
export const selectThreadSchema = createSelectSchema(threads);

export type InsertThreadInput = z.infer<typeof insertThreadSchema>;
export type SelectThreadOutput = z.infer<typeof selectThreadSchema>;

/*
  Messages table – individual messages inside a thread
*/
export const messages = sqliteTable('messages', {
  id: text('id', { length: 15 }).primaryKey().notNull(),
  content: text('content').notNull(),
  reasoning: text('reasoning'),
  status: text('status', {
    enum: Object.values(MessageStatusEnum) as [string, ...string[]],
  }),
  role: text('role', {
    enum: Object.values(MessageRoleEnum) as [string, ...string[]],
  }),
  modelId: text('modelId').references(() => models.id, { onDelete: 'cascade' }),
  sentAt: integer('sentAt', { mode: 'timestamp' }),
  threadId: text('thread')
    .notNull()
    .references(() => threads.id, { onDelete: 'cascade' }),
  createdAt: integer('created', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer('updated', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export type InsertMessageInput = z.infer<typeof insertMessageSchema>;
export type SelectMessageOutput = z.infer<typeof selectMessageSchema>;

/*
  Translations table – stores translation jobs & results
*/
export const translations = sqliteTable('translations', {
  id: text('id', { length: 15 }).primaryKey().notNull(),
  sourceText: text('sourceText').notNull(),
  translatedText: text('translatedText'),
  modelId: text('modelId').references(() => models.id, { onDelete: 'cascade' }),
  sourceLanguage: text('sourceLanguage', {
    enum: Object.values(LanguageEnum) as [string, ...string[]],
  }).notNull(),
  targetLanguage: text('targetLanguage', {
    enum: Object.values(LanguageEnum) as [string, ...string[]],
  }).notNull(),
  tone: text('tone', {
    enum: Object.values(ToneEnum) as [string, ...string[]],
  }),
  createdAt: integer('created', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer('updated', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

export const insertTranslationSchema = createInsertSchema(translations);
export const selectTranslationSchema = createSelectSchema(translations);

export type InsertTranslationInput = z.infer<typeof insertTranslationSchema>;
export type SelectTranslationOutput = z.infer<typeof selectTranslationSchema>;
