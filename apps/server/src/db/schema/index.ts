import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { codeToLanguageMap, toneToLabelMap } from '@/lib/translate';

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
  GEMINI: 'gemini',
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
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
    isEnabled: integer('isEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
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
    enum: Object.keys(codeToLanguageMap) as [string, ...string[]],
  }).notNull(),
  targetLanguage: text('targetLanguage', {
    enum: Object.keys(codeToLanguageMap) as [string, ...string[]],
  }).notNull(),
  tone: text('tone', {
    enum: Object.keys(toneToLabelMap) as [string, ...string[]],
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
