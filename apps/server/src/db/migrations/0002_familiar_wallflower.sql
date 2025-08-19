CREATE TABLE `generated_images` (
	`id` text(15) PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`imageData` text NOT NULL,
	`settings` text NOT NULL,
	`created` integer DEFAULT (unixepoch()),
	`updated` integer DEFAULT (unixepoch())
);
