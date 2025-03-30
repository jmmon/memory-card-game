import {
  // relations,
  sql,
} from "drizzle-orm";

import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
// import { scoreCounts } from "./scoreCounts.schema";
// import {ulid} from 'ulid';

/* scoreModel: {
 *   createdAt: Date,
 *   time: number,
 *   deckSize: number,
 *   mismatches: number,
 *   userId: string
 * }
 * */

// could ask for email input and generate an id deterministically from that
// then users can play from different devices and can have scores be related
// could ask for a displayName + an email address
//
// "Email address never leaves your browser. It is only used to generate a unique ID."
// "You can use this same email on multiple devices if you want your scores to be linked."
//
// so:
// email is for UUID, displayName is just a displayName
// email could be used to generate a sprite icon
export const scores = sqliteTable("scores", {
  id: integer("id")
    .$type<number>()
    .notNull()
    .primaryKey({ autoIncrement: true }),
  createdAt: text("created_at")
    .$type<string>()
    .notNull()
    .default(sql`datetime('subsec')`),
  deckSize: integer("deck_size").$type<number>().notNull(),
  gameTime: text("game_time").$type<number>().notNull(),
  mismatches: integer("mismatches").$type<number>().notNull(),
  pairs: integer("pairs").$type<number>().notNull(),
  userId: text("user_id").$type<string>().notNull(), // some uuid, hashed value of an identifier/hash
  initials: text("initials").$type<string>().notNull(), // some optional inputted string??
  color: text("color").$type<string>().notNull(), // hsl(xxx, xxx%, xxx%)
  pixelData: text("pixel_data").$type<string>().notNull(), // binary
});
//
// // each score has one scoreCounts
// export const scoresRelations = relations(scores, ({ one }) => ({
//   scoreCounts: one(scoreCounts, {
//     fields: [scores.id],
//     references: [scoreCounts.id],
//   }),
// }));

/*
 * Store the avatar info in the db:
 * color: string (hsl)
 * pixels: string ('01001011' etc)
 *
 * This would avoid rehashing the values to regenerate the avatar
 *
 * pixels: starts as a 40char hex string (base 16)
 * this could be translated to a maximum of 320chars at base 2
 *
 * 320 pixels covers half + center of the avatar
 * e.g. 32 cols * 10 rows = 320, * 2 = 640 pixels maximum at 64x10 dimensions
 * e.g. 16 cols * 20 rows = 320, * 2 = 640 pixels maximum at 32x20 dimensions
 * So the total pixels is exactly 2x the total chars
 * so if I only ever want 10*10 (100) pixels, I would only need 50 chars at base 2, which would be 50 / 8 = ~7 chars of hex
 * But maybe I should max the count at 256 and call it good.
 * */
