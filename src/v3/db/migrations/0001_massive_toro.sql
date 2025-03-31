CREATE INDEX if not exists `created_at_idx` ON `scores` (`created_at`);--> statement-breakpoint
CREATE INDEX if not exists `deck_size_idx` ON `scores` (`deck_size`);--> statement-breakpoint
CREATE INDEX if not exists `game_time_idx` ON `scores` (`game_time`);--> statement-breakpoint
CREATE INDEX if not exists `mismatches_idx` ON `scores` (`mismatches`);--> statement-breakpoint
CREATE INDEX if not exists `pairs_idx` ON `scores` (`pairs`);--> statement-breakpoint
CREATE INDEX if not exists `counts_deck_size_idx` ON `score_counts` (`deck_size`);
