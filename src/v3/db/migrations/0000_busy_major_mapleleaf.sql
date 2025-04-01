CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`deck_size` integer NOT NULL,
	`game_time_ds` integer NOT NULL,
	`mismatches` integer NOT NULL,
	`pairs` integer NOT NULL,
	`user_id` text NOT NULL,
	`initials` text NOT NULL,
	`color` text NOT NULL,
	`pixel_data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `s_created_at_idx` ON `scores` (`created_at`);--> statement-breakpoint
CREATE INDEX `s_deck_size_idx` ON `scores` (`deck_size`);--> statement-breakpoint
CREATE INDEX `s_game_time_ds_idx` ON `scores` (`game_time_ds`);--> statement-breakpoint
CREATE INDEX `s_mismatches_idx` ON `scores` (`mismatches`);--> statement-breakpoint
CREATE INDEX `s_pairs_idx` ON `scores` (`pairs`);--> statement-breakpoint
CREATE TABLE `score_counts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_size` integer NOT NULL,
	`worse_than_our_mismatches_map` text NOT NULL,
	`worse_than_our_game_time_map` text NOT NULL,
	`total_scores` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sc_deck_size_idx` ON `score_counts` (`deck_size`);