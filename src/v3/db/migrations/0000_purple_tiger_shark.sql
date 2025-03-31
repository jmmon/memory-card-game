CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT '(datetime(''subsec''))' NOT NULL,
	`deck_size` integer NOT NULL,
	`game_time` text NOT NULL,
	`mismatches` integer NOT NULL,
	`pairs` integer NOT NULL,
	`user_id` text NOT NULL,
	`initials` text NOT NULL,
	`color` text NOT NULL,
	`pixel_data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `score_counts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_size` integer NOT NULL,
	`worse_than_our_mismatches_map` text NOT NULL,
	`worse_than_our_game_time_map` text NOT NULL,
	`total_scores` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT '(datetime(''subsec''))' NOT NULL
);
