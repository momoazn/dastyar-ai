CREATE TABLE `chat_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`last_message_at` integer,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_threads_user_id` ON `chat_threads` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_threads_last_message_at` ON `chat_threads` (`last_message_at`);--> statement-breakpoint
CREATE TABLE `code_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`language` text NOT NULL,
	`input_code` text NOT NULL,
	`error_message` text,
	`output` text NOT NULL,
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_code_runs_user_id` ON `code_runs` (`user_id`);--> statement-breakpoint
CREATE TABLE `document_chunks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`document_id` integer NOT NULL,
	`chunk_index` integer NOT NULL,
	`page` integer,
	`content` text NOT NULL,
	`embedding` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_document_chunks_document_id` ON `document_chunks` (`document_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_documents_user_id` ON `documents` (`user_id`);--> statement-breakpoint
CREATE TABLE `generated_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt` text NOT NULL,
	`negative_prompt` text,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`settings` text NOT NULL,
	`thread_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `image_threads`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_generated_images_thread_id` ON `generated_images` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_generated_images_user_id` ON `generated_images` (`user_id`);--> statement-breakpoint
CREATE TABLE `image_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`last_image_at` integer,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_image_threads_user_id` ON `image_threads` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_image_threads_last_image_at` ON `image_threads` (`last_image_at`);--> statement-breakpoint
CREATE TABLE `llm_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identifier` text NOT NULL,
	`provider` text NOT NULL,
	`creator` text,
	`family` text,
	`size` text,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_llm_models_provider_identifier` ON `llm_models` (`provider`,`identifier`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parts` text NOT NULL,
	`status` text NOT NULL,
	`role` text NOT NULL,
	`thread_id` integer NOT NULL,
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_thread_id` ON `messages` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_user_id` ON `messages` (`user_id`);--> statement-breakpoint
CREATE TABLE `summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_text` text NOT NULL,
	`summary_text` text,
	`mode` text NOT NULL,
	`tone` text,
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_summaries_user_id` ON `summaries` (`user_id`);--> statement-breakpoint
CREATE TABLE `thread_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL,
	`document_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `chat_threads`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_thread_documents_thread_id` ON `thread_documents` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_documents_document_id` ON `thread_documents` (`document_id`);--> statement-breakpoint
CREATE TABLE `translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_text` text NOT NULL,
	`translated_text` text,
	`source_language` text NOT NULL,
	`target_language` text NOT NULL,
	`tone` text,
	`source_type` text DEFAULT 'text' NOT NULL,
	`source_file_name` text,
	`payload` text,
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_translations_user_id` ON `translations` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`code_model_id` integer,
	`code_mode` text,
	`code_language` text,
	`translation_model_id` integer,
	`translation_source_language` text,
	`translation_target_language` text,
	`translation_tone` text,
	`summarize_model_id` integer,
	`summarize_mode` text,
	`summarize_tone` text,
	`transcribe_model` text,
	`transcribe_language` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`code_model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`translation_model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`summarize_model_id`) REFERENCES `llm_models`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_preferences_user_id` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`salt` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);