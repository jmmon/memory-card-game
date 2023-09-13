import { sql } from "drizzle-orm";
import {
  integer,
  interval,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
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
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { withTimezone: true }).default(sql`now()`),
  deckSize: integer("deckSize"),
  gameTime: interval("gameTime", { precision: 6 }),
  mismatches: integer("mismatches"),
  pairs: integer("pairs"),
  userId: varchar("userId", { length: 64 }), // some uuid, hashed value of an identifier/hash
  initials: varchar("initials", { length: 32 }), // some optional inputted string??
  color: varchar("color", { length: 32 }), // hsl(xxx, xxx%, xxx%)
  pixels: varchar("pixels", { length: 256 }), // binary
});

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
