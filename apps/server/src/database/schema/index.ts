import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
  TranscribeLanguage,
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
  transcribeLanguages,
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
  salt: text("salt").notNull(),
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

export const userPreferences = sqliteTable(
  "user_preferences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    codeModelId: integer("code_model_id").references(() => llmModels.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    codeMode: text("code_mode", { enum: codeModes }).$type<CodeMode>(),
    codeLanguage: text("code_language", {
      enum: programmingLanguages,
    }).$type<ProgrammingLanguage>(),
    translationModelId: integer("translation_model_id").references(
      () => llmModels.id,
      { onDelete: "set null", onUpdate: "cascade" }
    ),
    translationSourceLanguage: text("translation_source_language", {
      enum: languageCodes,
    }).$type<LanguageCode>(),
    translationTargetLanguage: text("translation_target_language", {
      enum: languageCodes,
    }).$type<LanguageCode>(),
    translationTone: text("translation_tone", { enum: tones }).$type<Tone>(),
    summarizeModelId: integer("summarize_model_id").references(
      () => llmModels.id,
      { onDelete: "set null", onUpdate: "cascade" }
    ),
    summarizeMode: text("summarize_mode", {
      enum: summaryModes,
    }).$type<SummaryMode>(),
    summarizeTone: text("summarize_tone", { enum: tones }).$type<Tone>(),
    transcribeModel: text("transcribe_model"),
    transcribeLanguage: text("transcribe_language", {
      enum: transcribeLanguages,
    }).$type<TranscribeLanguage>(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [index("idx_user_preferences_user_id").on(table.userId)]
);

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
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [index("idx_summaries_user_id").on(table.userId)]
);

export const imageThreads = sqliteTable(
  "image_threads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    isArchived: integer("is_archived", { mode: "boolean" })
      .notNull()
      .default(false),
    lastImageAt: integer("last_image_at", { mode: "timestamp" }),
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
    index("idx_image_threads_user_id").on(table.userId),
    index("idx_image_threads_last_image_at").on(table.lastImageAt),
  ]
);

export const generatedImages = sqliteTable(
  "generated_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negative_prompt"),
    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    settings: text("settings", { mode: "json" }).notNull(),
    threadId: integer("thread_id")
      .notNull()
      .references(() => imageThreads.id, {
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
    index("idx_generated_images_thread_id").on(table.threadId),
    index("idx_generated_images_user_id").on(table.userId),
  ]
);

export const codeRuns = sqliteTable(
  "code_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mode: text("mode", { enum: codeModes }).$type<CodeMode>().notNull(),
    language: text("language", { enum: programmingLanguages })
      .$type<ProgrammingLanguage>()
      .notNull(),
    inputCode: text("input_code").notNull(),
    errorMessage: text("error_message"),
    output: text("output").notNull(),
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
  },
  (table) => [index("idx_code_runs_user_id").on(table.userId)]
);

export const documents = sqliteTable(
  "documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    filePath: text("file_path").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
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
  (table) => [index("idx_documents_user_id").on(table.userId)]
);

export const documentChunks = sqliteTable(
  "document_chunks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    chunkIndex: integer("chunk_index").notNull(),
    page: integer("page"),
    content: text("content").notNull(),
    embedding: text("embedding", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [index("idx_document_chunks_document_id").on(table.documentId)]
);

export const threadDocuments = sqliteTable(
  "thread_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    threadId: integer("thread_id")
      .notNull()
      .references(() => chatThreads.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(timestamp),
  },
  (table) => [
    index("idx_thread_documents_thread_id").on(table.threadId),
    index("idx_thread_documents_document_id").on(table.documentId),
  ]
);

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  chatThreads: many(chatThreads),
  messages: many(messages),
  translations: many(translations),
  summaries: many(summaries),
  imageThreads: many(imageThreads),
  generatedImages: many(generatedImages),
  codeRuns: many(codeRuns),
  documents: many(documents),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
    codeModel: one(llmModels, {
      fields: [userPreferences.codeModelId],
      references: [llmModels.id],
    }),
    translationModel: one(llmModels, {
      fields: [userPreferences.translationModelId],
      references: [llmModels.id],
    }),
    summarizeModel: one(llmModels, {
      fields: [userPreferences.summarizeModelId],
      references: [llmModels.id],
    }),
  })
);

export const llmModelsRelations = relations(llmModels, ({ many }) => ({
  messages: many(messages),
  translations: many(translations),
  summaries: many(summaries),
  codeRuns: many(codeRuns),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id],
  }),
  messages: many(messages),
  threadDocuments: many(threadDocuments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [messages.threadId],
    references: [chatThreads.id],
  }),
  model: one(llmModels, {
    fields: [messages.modelId],
    references: [llmModels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const translationsRelations = relations(translations, ({ one }) => ({
  user: one(users, {
    fields: [translations.userId],
    references: [users.id],
  }),
  model: one(llmModels, {
    fields: [translations.modelId],
    references: [llmModels.id],
  }),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  user: one(users, {
    fields: [summaries.userId],
    references: [users.id],
  }),
  model: one(llmModels, {
    fields: [summaries.modelId],
    references: [llmModels.id],
  }),
}));

export const imageThreadsRelations = relations(
  imageThreads,
  ({ one, many }) => ({
    user: one(users, {
      fields: [imageThreads.userId],
      references: [users.id],
    }),
    images: many(generatedImages),
  })
);

export const generatedImagesRelations = relations(
  generatedImages,
  ({ one }) => ({
    thread: one(imageThreads, {
      fields: [generatedImages.threadId],
      references: [imageThreads.id],
    }),
    user: one(users, {
      fields: [generatedImages.userId],
      references: [users.id],
    }),
  })
);

export const codeRunsRelations = relations(codeRuns, ({ one }) => ({
  model: one(llmModels, {
    fields: [codeRuns.modelId],
    references: [llmModels.id],
  }),
  user: one(users, {
    fields: [codeRuns.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  chunks: many(documentChunks),
  threadDocuments: many(threadDocuments),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const threadDocumentsRelations = relations(
  threadDocuments,
  ({ one }) => ({
    thread: one(chatThreads, {
      fields: [threadDocuments.threadId],
      references: [chatThreads.id],
    }),
    document: one(documents, {
      fields: [threadDocuments.documentId],
      references: [documents.id],
    }),
  })
);

// ============================================================================
// Zod Schemas
// ============================================================================

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const selectUserPreferencesSchema = createSelectSchema(userPreferences);
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type SelectUserPreferences = z.infer<typeof selectUserPreferencesSchema>;

export const insertLlmModelSchema = createInsertSchema(llmModels);
export const selectLlmModelSchema = createSelectSchema(llmModels);
export type InsertLlmModel = z.infer<typeof insertLlmModelSchema>;
export type SelectLlmModel = z.infer<typeof selectLlmModelSchema>;

export const insertChatThreadSchema = createInsertSchema(chatThreads);
export const selectChatThreadSchema = createSelectSchema(chatThreads);
export type InsertChatThread = z.infer<typeof insertChatThreadSchema>;
export type SelectChatThread = z.infer<typeof selectChatThreadSchema>;

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SelectMessage = z.infer<typeof selectMessageSchema>;

export const insertTranslationSchema = createInsertSchema(translations);
export const selectTranslationSchema = createSelectSchema(translations);
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type SelectTranslation = z.infer<typeof selectTranslationSchema>;

export const insertSummarySchema = createInsertSchema(summaries);
export const selectSummarySchema = createSelectSchema(summaries);
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type SelectSummary = z.infer<typeof selectSummarySchema>;

export const insertImageThreadSchema = createInsertSchema(imageThreads);
export const selectImageThreadSchema = createSelectSchema(imageThreads);
export type InsertImageThread = z.infer<typeof insertImageThreadSchema>;
export type SelectImageThread = z.infer<typeof selectImageThreadSchema>;

export const insertGeneratedImageSchema = createInsertSchema(generatedImages);
export const selectGeneratedImageSchema = createSelectSchema(generatedImages);
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type SelectGeneratedImage = z.infer<typeof selectGeneratedImageSchema>;

export const insertCodeRunSchema = createInsertSchema(codeRuns);
export const selectCodeRunSchema = createSelectSchema(codeRuns);
export type InsertCodeRun = z.infer<typeof insertCodeRunSchema>;
export type SelectCodeRun = z.infer<typeof selectCodeRunSchema>;

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SelectDocument = z.infer<typeof selectDocumentSchema>;

export const insertDocumentChunkSchema = createInsertSchema(documentChunks);
export const selectDocumentChunkSchema = createSelectSchema(documentChunks);
export type InsertDocumentChunk = z.infer<typeof insertDocumentChunkSchema>;
export type SelectDocumentChunk = z.infer<typeof selectDocumentChunkSchema>;

export const insertThreadDocumentSchema = createInsertSchema(threadDocuments);
export const selectThreadDocumentSchema = createSelectSchema(threadDocuments);
export type InsertThreadDocument = z.infer<typeof insertThreadDocumentSchema>;
export type SelectThreadDocument = z.infer<typeof selectThreadDocumentSchema>;

// ============================================================================
// Type Aliases (for backwards compatibility)
// ============================================================================

export type User = SelectUser;
export type LLMModel = SelectLlmModel;
export type ChatThread = SelectChatThread;
export type Message = SelectMessage;
export type Translation = SelectTranslation;
export type Summary = SelectSummary;
export type ImageThread = SelectImageThread;
export type GeneratedImage = SelectGeneratedImage;
export type CodeRun = SelectCodeRun;
export type Document = SelectDocument;
export type DocumentChunk = SelectDocumentChunk;
export type ThreadDocument = SelectThreadDocument;
export type UserPreferences = SelectUserPreferences;

// Re-export types from types.ts
export * from "./types";
