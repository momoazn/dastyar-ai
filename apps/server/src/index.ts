import { existsSync } from "node:fs";
import { serve } from "bun";
import { createApp } from "./app";
import {
  ensureDirectoriesExist,
  env,
  isProduction,
  resolveConfiguredPath,
} from "./config";
import { sqlite } from "./database";

const SQL = `
-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "llm_models" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "chat_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parts" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "model_id" INTEGER NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "translations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT,
    "model_id" INTEGER NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "tone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "translations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "translations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "summaries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceText" TEXT NOT NULL,
    "summaryText" TEXT,
    "model_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "tone" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "summaries_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "image_threads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "last_image_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "image_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "generated_images_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "image_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generated_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "code_assist_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "code_assist_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "code_generations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "generatedCode" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "model_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "code_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "code_generations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "code_assist_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "code_generations_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "code_reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "session_id" INTEGER NOT NULL,
    "codeInput" TEXT NOT NULL,
    "reviewFeedback" TEXT NOT NULL,
    "suggestions" TEXT NOT NULL,
    "severityLevels" TEXT NOT NULL,
    "model_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "code_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "code_reviews_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "code_assist_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "code_reviews_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_generated_images_thread" ON "generated_images"("thread_id");
`;

const databasePath = resolveConfiguredPath(env.DATABASE_FILE);
ensureDirectoriesExist();

const dbExists = existsSync(databasePath);
const hasUsersTable =
  sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users';"
    )
    .get() !== undefined;

if (!(dbExists && hasUsersTable)) {
  sqlite.run(SQL);
}

console.log("Running app in", isProduction() ? "production" : "development");

const app = createApp();

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
});

console.log(`Server listening on http://${server.hostname}:${server.port}`);
