import { sql } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import { ModelProviderEnum } from '@/lib/providers/constants';
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

/*
  Summaries table – stores summary jobs & results
*/
export const summaries = sqliteTable('summaries', {
  id: text('id', { length: 15 }).primaryKey().notNull(),
  sourceText: text('sourceText').notNull(),
  summaryText: text('summaryText'),
  modelId: text('modelId').references(() => models.id, { onDelete: 'cascade' }),
  mode: text('mode', {
    enum: ['concise', 'standard', 'detailed'] as const,
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

export const insertSummarySchema = createInsertSchema(summaries);
export const selectSummarySchema = createSelectSchema(summaries);

export type InsertSummaryInput = z.infer<typeof insertSummarySchema>;
export type SelectSummaryOutput = z.infer<typeof selectSummarySchema>;

/*
  Generated Images table – stores AI-generated images metadata
*/
export const generatedImages = sqliteTable('generated_images', {
  id: text('id', { length: 15 }).primaryKey().notNull(),
  prompt: text('prompt').notNull(),
  negativePrompt: text('negativePrompt'),
  imageData: text('imageData').notNull(), // base64 encoded image
  settings: text('settings').notNull(), // JSON string of generation settings
  createdAt: integer('created', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
  updatedAt: integer('updated', { mode: 'timestamp' }).default(
    sql`(unixepoch())`
  ),
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages);
export const selectGeneratedImageSchema = createSelectSchema(generatedImages);

export type InsertGeneratedImageInput = z.infer<typeof insertGeneratedImageSchema>;
export type SelectGeneratedImageOutput = z.infer<typeof selectGeneratedImageSchema>;
