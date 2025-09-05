CREATE TABLE `generated_images` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`filePath` text NOT NULL,
	`fileName` text NOT NULL,
	`settings` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`parts` text NOT NULL,
	`status` text NOT NULL,
	`role` text NOT NULL,
	`modelName` text NOT NULL,
	`threadId` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	FOREIGN KEY (`threadId`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `summaries` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`sourceText` text NOT NULL,
	`summaryText` text,
	`modelName` text NOT NULL,
	`mode` text NOT NULL,
	`tone` text,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`lastMessageAt` integer,
	`createdAt` integer,
	`updatedAt` integer
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` text(36) PRIMARY KEY NOT NULL,
	`sourceText` text NOT NULL,
	`translatedText` text,
	`modelName` text NOT NULL,
	`sourceLanguage` text NOT NULL,
	`targetLanguage` text NOT NULL,
	`tone` text,
	`createdAt` integer,
	`updatedAt` integer
);
