CREATE TABLE `generated_images` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`imageData` text NOT NULL,
	`settings` text NOT NULL,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`reasoning` text,
	`status` text,
	`role` text,
	`modelId` text,
	`sentAt` integer,
	`thread` text NOT NULL,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`thread`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`isEnabled` integer DEFAULT true NOT NULL,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_provider_name_uq` ON `models` (`provider`,`name`);--> statement-breakpoint
CREATE TABLE `summaries` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`sourceText` text NOT NULL,
	`summaryText` text,
	`modelId` text,
	`mode` text NOT NULL,
	`tone` text,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`lastMessageAt` integer,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`sourceText` text NOT NULL,
	`translatedText` text,
	`modelId` text,
	`sourceLanguage` text NOT NULL,
	`targetLanguage` text NOT NULL,
	`tone` text,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`modelId`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
