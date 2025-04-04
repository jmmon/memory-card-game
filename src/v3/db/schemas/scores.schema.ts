import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";

// some unique id will be asked to generate the UUID via a hashing algorithm
//    e.g. email or something
//    - never stored, only hashed to generate the id
//    - id is used to generate the pixel identicon
// "Email address never leaves your browser. It is only used to generate a unique ID."
// "You can use this same email on multiple devices if you want the identicon geometry to match"
//
// Also asks for initials, like an old school arcade game
//    e.g. JMM
//    - this will be stored and also will be used to generate the color of the identicon
//
//
export const scoresSchema = sqliteTable(
  "scores",
  {
    id: integer("id")
      .$type<number>()
      .notNull()
      .primaryKey({ autoIncrement: true }),

    // these all have indices
    createdAt: integer("created_at").$type<number>().notNull(),
    deckSize: integer("deck_size").$type<number>().notNull(),
    gameTimeDs: integer("game_time_ds").$type<number>().notNull(),
    mismatches: integer("mismatches").$type<number>().notNull(),
    pairs: integer("pairs").$type<number>().notNull(),
    // end inexed columns

    userId: text("user_id").$type<string>().notNull(), // some uuid, hashed value of an identifier/hash
    initials: text("initials").$type<string>().notNull(), // some optional inputted string??
  },
  (table) => [
    index("s_created_at_idx").on(table.createdAt),
    index("s_deck_size_idx").on(table.deckSize),
    index("s_game_time_ds_idx").on(table.gameTimeDs),
    index("s_mismatches_idx").on(table.mismatches),
    index("s_pairs_idx").on(table.pairs),
  ],
);
