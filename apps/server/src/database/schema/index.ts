import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const userRoles = ["admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

export const llmModelProviders = ["ollama", "lmstudio"] as const;
export type LLMModelProvider = (typeof llmModelProviders)[number];

export const messageStatuses = [
  "streaming",
  "finished",
  "errored",
  "stopped",
] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export const messageRoles = ["user", "assistant"] as const;
export type MessageRole = (typeof messageRoles)[number];

export const languageCodes = ["en", "fa", "ar", "fr", "de", "es"] as const;
export type LanguageCode = (typeof languageCodes)[number];

export const tones = [
  "formal",
  "informal",
  "business",
  "academic",
  "technical",
  "creative",
  "friendly",
  "professional",
] as const;
export type Tone = (typeof tones)[number];

export const summaryModes = ["concise", "standard", "detailed"] as const;
export type SummaryMode = (typeof summaryModes)[number];

const nowUnix = sql`(strftime('%s','now'))`;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  salt: text("salt").notNull(),
  role: text("role").$type<UserRole>().notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(nowUnix),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(nowUnix),
});

export const llmModels = sqliteTable("llm_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  provider: text("provider", { enum: llmModelProviders }).notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const chatThreads = sqliteTable("chat_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parts: text("parts", { mode: "json" }).notNull(),
  status: text("status", { enum: messageStatuses }).notNull(),
  role: text("role", { enum: messageRoles }).notNull(),
  modelId: integer("model_id")
    .notNull()
    .references(() => llmModels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  threadId: integer("thread_id")
    .notNull()
    .references(() => chatThreads.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const translations = sqliteTable("translations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceText: text("sourceText").notNull(),
  translatedText: text("translatedText"),
  modelId: integer("model_id")
    .notNull()
    .references(() => llmModels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  sourceLanguage: text("sourceLanguage", { enum: languageCodes }).notNull(),
  targetLanguage: text("targetLanguage", { enum: languageCodes }).notNull(),
  tone: text("tone", { enum: tones }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const summaries = sqliteTable("summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceText: text("sourceText").notNull(),
  summaryText: text("summaryText"),
  modelId: integer("model_id")
    .notNull()
    .references(() => llmModels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  mode: text("mode", { enum: summaryModes }).notNull(),
  tone: text("tone", { enum: tones }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const imageThreads = sqliteTable("image_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
  lastImageAt: integer("last_image_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const generatedImages = sqliteTable(
  "generated_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    prompt: text("prompt").notNull(),
    negativePrompt: text("negativePrompt"),
    filePath: text("filePath").notNull(),
    fileName: text("fileName").notNull(),
    settings: text("settings", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    threadId: integer("thread_id")
      .notNull()
      .references(() => imageThreads.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => ({
    threadIdx: index("idx_generated_images_thread").on(table.threadId),
  })
);

export const codeAssistSessions = sqliteTable("code_assist_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  language: text("language").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const codeGenerations = sqliteTable("code_generations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => codeAssistSessions.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  prompt: text("prompt").notNull(),
  generatedCode: text("generatedCode").notNull(),
  language: text("language").notNull(),
  modelId: integer("model_id")
    .notNull()
    .references(() => llmModels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const codeReviews = sqliteTable("code_reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => codeAssistSessions.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  codeInput: text("codeInput").notNull(),
  reviewFeedback: text("reviewFeedback").notNull(),
  suggestions: text("suggestions").notNull(),
  severityLevels: text("severityLevels").notNull(),
  modelId: integer("model_id")
    .notNull()
    .references(() => llmModels.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  chatThreads: many(chatThreads),
  messages: many(messages),
  translations: many(translations),
  summaries: many(summaries),
  imageThreads: many(imageThreads),
  generatedImages: many(generatedImages),
  codeAssistSessions: many(codeAssistSessions),
  codeGenerations: many(codeGenerations),
  codeReviews: many(codeReviews),
}));

export const llmModelsRelations = relations(llmModels, ({ many }) => ({
  messages: many(messages),
  translations: many(translations),
  summaries: many(summaries),
  codeGenerations: many(codeGenerations),
  codeReviews: many(codeReviews),
}));

export const chatThreadsRelations = relations(chatThreads, ({ one, many }) => ({
  user: one(users, {
    fields: [chatThreads.userId],
    references: [users.id],
  }),
  messages: many(messages),
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

export const codeAssistSessionsRelations = relations(
  codeAssistSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [codeAssistSessions.userId],
      references: [users.id],
    }),
    codeGenerations: many(codeGenerations),
    codeReviews: many(codeReviews),
  })
);

export const codeGenerationsRelations = relations(
  codeGenerations,
  ({ one }) => ({
    session: one(codeAssistSessions, {
      fields: [codeGenerations.sessionId],
      references: [codeAssistSessions.id],
    }),
    model: one(llmModels, {
      fields: [codeGenerations.modelId],
      references: [llmModels.id],
    }),
    user: one(users, {
      fields: [codeGenerations.userId],
      references: [users.id],
    }),
  })
);

export const codeReviewsRelations = relations(codeReviews, ({ one }) => ({
  session: one(codeAssistSessions, {
    fields: [codeReviews.sessionId],
    references: [codeAssistSessions.id],
  }),
  model: one(llmModels, {
    fields: [codeReviews.modelId],
    references: [llmModels.id],
  }),
  user: one(users, {
    fields: [codeReviews.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

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

export const insertCodeAssistSessionSchema =
  createInsertSchema(codeAssistSessions);
export const selectCodeAssistSessionSchema =
  createSelectSchema(codeAssistSessions);
export type InsertCodeAssistSession = z.infer<
  typeof insertCodeAssistSessionSchema
>;
export type SelectCodeAssistSession = z.infer<
  typeof selectCodeAssistSessionSchema
>;

export const insertCodeGenerationSchema = createInsertSchema(codeGenerations);
export const selectCodeGenerationSchema = createSelectSchema(codeGenerations);
export type InsertCodeGeneration = z.infer<typeof insertCodeGenerationSchema>;
export type SelectCodeGeneration = z.infer<typeof selectCodeGenerationSchema>;

export const insertCodeReviewSchema = createInsertSchema(codeReviews);
export const selectCodeReviewSchema = createSelectSchema(codeReviews);
export type InsertCodeReview = z.infer<typeof insertCodeReviewSchema>;
export type SelectCodeReview = z.infer<typeof selectCodeReviewSchema>;
