import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';
import {
  languageCodes,
  messageRoles,
  messageStatuses,
  summaryModes,
  tones,
} from '@/utils/constants';

/*
  Threads table – represents a chat thread 
*/
export const threads = sqliteTable('threads', {
  id: text('id', { length: 36 }).primaryKey().notNull(),
  title: text('title').notNull(),
  isArchived: integer('isArchived', { mode: 'boolean' })
    .notNull()
    .default(false),
  lastMessageAt: integer('lastMessageAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const insertThreadSchema = createInsertSchema(threads);
export const selectThreadSchema = createSelectSchema(threads);

export type InsertThreadInput = z.infer<typeof insertThreadSchema>;
export type SelectThreadOutput = z.infer<typeof selectThreadSchema>;

/*
  Messages table – individual messages inside a thread
*/
export const messagesTable = sqliteTable('messages', {
  id: text('id', { length: 36 }).primaryKey().notNull(),
  parts: text('parts', { mode: 'json' }).notNull(),
  status: text('status', { enum: messageStatuses }).notNull(),
  role: text('role', { enum: messageRoles }).notNull(),
  modelName: text('modelName').notNull(),
  threadId: text('threadId')
    .notNull()
    .references(() => threads.id, { onDelete: 'cascade' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const insertMessageSchema = createInsertSchema(messagesTable);
export const selectMessageSchema = createSelectSchema(messagesTable);

export type InsertMessageInput = z.infer<typeof insertMessageSchema>;
export type SelectMessageOutput = z.infer<typeof selectMessageSchema>;

// Relations
export const messagesRelations = relations(messagesTable, ({ one }) => ({
  thread: one(threads, {
    fields: [messagesTable.threadId],
    references: [threads.id],
  }),
}));

export const threadsRelations = relations(threads, ({ many }) => ({
  messages: many(messagesTable),
}));

/*
  Translations table – stores translation jobs & results
*/
export const translationsTable = sqliteTable('translations', {
  id: text('id', { length: 36 }).primaryKey().notNull(),
  sourceText: text('sourceText').notNull(),
  translatedText: text('translatedText'),
  modelName: text('modelName').notNull(),
  sourceLanguage: text('sourceLanguage', { enum: languageCodes }).notNull(),
  targetLanguage: text('targetLanguage', { enum: languageCodes }).notNull(),
  tone: text('tone', { enum: tones }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const insertTranslationSchema = createInsertSchema(translationsTable);
export const selectTranslationSchema = createSelectSchema(translationsTable);

export type InsertTranslationInput = z.infer<typeof insertTranslationSchema>;
export type SelectTranslationOutput = z.infer<typeof selectTranslationSchema>;

/*
  Summaries table – stores summary jobs & results
*/
export const summariesTable = sqliteTable('summaries', {
  id: text('id', { length: 36 }).primaryKey().notNull(),
  sourceText: text('sourceText').notNull(),
  summaryText: text('summaryText'),
  modelName: text('modelName').notNull(),
  mode: text('mode', { enum: summaryModes }).notNull(),
  tone: text('tone', { enum: tones }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const insertSummarySchema = createInsertSchema(summariesTable);
export const selectSummarySchema = createSelectSchema(summariesTable);

export type InsertSummaryInput = z.infer<typeof insertSummarySchema>;
export type SelectSummaryOutput = z.infer<typeof selectSummarySchema>;

/*
  Generated Images table – stores AI-generated images metadata
*/
export const generatedImagesTable = sqliteTable('generated_images', {
  id: text('id', { length: 36 }).primaryKey().notNull(),
  prompt: text('prompt').notNull(),
  negativePrompt: text('negativePrompt'),
  filePath: text('filePath').notNull(), // File system path to the image
  fileName: text('fileName').notNull(), // Original filename for downloads
  settings: text('settings').notNull(), // JSON string of generation settings
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const insertGeneratedImageSchema =
  createInsertSchema(generatedImagesTable);
export const selectGeneratedImageSchema =
  createSelectSchema(generatedImagesTable);

export type InsertGeneratedImageInput = z.infer<
  typeof insertGeneratedImageSchema
>;
export type SelectGeneratedImageOutput = z.infer<
  typeof selectGeneratedImageSchema
>;
