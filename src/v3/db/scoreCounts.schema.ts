import {
  integer,
  pgTable,
  serial,
  json,
} from "drizzle-orm/pg-core";
import {type LessThanOurScoreObj } from "../types/types";
// import {ulid} from 'ulid';

/*
 * How to calculate percentiles?
 * I would need all the scores for the given deckSize
 * for a given score of a given deckSize, we need to know:
 *   - total scores for those conditions
 *   - count of scores less than this score
 *
 * How?
 * - could query all scores of given deckSize, sorted by gameTime (or mismatches)
 * - then we can know the length of the total set
 * - and we can count how many land under our score
 * - that way we can calculate the percentile for this score
*
* Performance:
* Should I save some of this data in a secondaory table? scoreCounts table?
* - scoreCounts might be for a given deckSize
* - scoreCounts[size: 6] = {
*     totalScores: n, (increment when we add a new score of this deckSize)
*     lessThanOurScoreMap: {
*       [ourScore (e.g. our mismatches)]: m (count less than our score)
*       // when add a score of this deckSize, take our mismatches.
*       // For each entry where key:mismatches is GREATER THAN our mismatches,
*       //  - add 1 to each value
*     }
*   }
* e.g. we have scores for deckSize of 6:
* totalScores = 12,
* lessThanOurScoreMap: {
* 1: 0, // if our score is 1, there are 0 less than this score
* 2: 2,
* 3: 4,
* 4: 6, // if our score is 4, there are 6 scores less than this score
* 5: 9, // if our score is 5, there are 9 scores less than this score
* 6: 10,
* 8: 11, // 11 are less than a score of 8, so a score of 8 is the 12th score
* }
* 
* When adding a new score of deckSize 6: score.mismatches = 4
* totalScores = 12 + 1,
* lessThanOurScoreMap: {
*   1: 0,
*   2: 2,
*   3: 4,
*   4: 6, // -- our score
*   5: 9 + 1, // we scored 4, so we have to increment any that land ABOVE our score
*   6: 10 + 1,
*   8: 11 + 1 // now the score of 8 is the 13th score, with 12 less than it
* }
*
 * */

export const scoreCounts = pgTable("scoreCounts", {
  id: serial("id").primaryKey(),
  deckSize: integer("deckSize"),
  lessThanOurMismatchesMap: json("lessThanOurMismatchesMap").$type<LessThanOurScoreObj>(),
  lessThanOurGameTimeMap: json("lessThanOurMismatchesMap").$type<LessThanOurScoreObj>(),
});
