CREATE TABLE `ollama_servers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`base_url` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ollama_servers_base_url_unique` ON `ollama_servers` (`base_url`);
--> statement-breakpoint
CREATE INDEX `idx_ollama_servers_enabled` ON `ollama_servers` (`is_enabled`);
--> statement-breakpoint
CREATE TABLE `ollama_server_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`server_id` integer NOT NULL,
	`model_identifier` text NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `ollama_servers`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_ollama_server_models_server_id` ON `ollama_server_models` (`server_id`);
--> statement-breakpoint
CREATE INDEX `idx_ollama_server_models_identifier` ON `ollama_server_models` (`model_identifier`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_ollama_server_models_server_identifier` ON `ollama_server_models` (`server_id`,`model_identifier`);
