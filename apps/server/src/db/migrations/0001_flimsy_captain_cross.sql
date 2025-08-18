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
