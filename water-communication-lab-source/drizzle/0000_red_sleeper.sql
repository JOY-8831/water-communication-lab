CREATE TABLE `sessions` (
	`code` text PRIMARY KEY NOT NULL,
	`host_token` text NOT NULL,
	`phase` text DEFAULT 'welcome' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_code` text NOT NULL,
	`voter_id` text NOT NULL,
	`group_code` text NOT NULL,
	`round` integer NOT NULL,
	`choice` text NOT NULL,
	`confidence` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `votes_one_per_round` ON `votes` (`session_code`,`voter_id`,`round`);