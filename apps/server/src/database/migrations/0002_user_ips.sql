CREATE TABLE `user_ips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ip_address` text NOT NULL,
	`first_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()) NOT NULL,
	`hit_count` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_ips_user_id` ON `user_ips` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_ips_last_seen_at` ON `user_ips` (`last_seen_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_user_ips_user_ip` ON `user_ips` (`user_id`,`ip_address`);
