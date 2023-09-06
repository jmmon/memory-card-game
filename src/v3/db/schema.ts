import { integer, interval, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
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
export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('createdAt', {withTimezone: true}),
  deckSize: integer('deckSize'),
  gameTime: interval('gameTime'),
  mismatches: integer('mismatches'),
  userId: varchar('userId', { length: 256 }), // some uuid
  initials: varchar('initials', { length: 256 }), // some optional inputted string??
});

export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;

