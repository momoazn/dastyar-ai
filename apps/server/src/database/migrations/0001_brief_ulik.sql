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
	`transcribe_engine` text,
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
CREATE INDEX `idx_user_preferences_user_id` ON `user_preferences` (`user_id`);