import { eq, inArray } from "drizzle-orm";
import { getDB, scoreCounts } from "../../db";
import {
  ScoreTableColumnEnum,
  type LessThanOurScoreObj,
} from "../../types/types";
// import { DEFAULT_QUERY_PROPS } from "./constants";
// import type { CountsQueryProps } from "./types";
import type {
  InsertScoreCount,
  Score,
  ScoreCount,
} from "~/v3/db/schemas/types";
import { buildOrderBy } from "./scores.service";
import { DEFAULT_SORT_BY_COLUMNS_MAP } from "~/v3/components/scores-modal/constants";

const getAllScoreCounts = () => getDB().select().from(scoreCounts);

// const queryScoreCounts = ({
//   deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
//   sortDirection = DEFAULT_QUERY_PROPS.sortDirection,
// }: Partial<CountsQueryProps>) =>
//   getAllScoreCounts()
//     .where(inArray(scoreCounts.deckSize, deckSizesFilter))
//     .orderBy(
//       ...buildOrderBy(
//         [
//           {
//             column: ScoreTableColumnEnum.deck_size,
//             direction: sortDirection,
//           },
//         ],
//         scoreCounts,
//       ),
//     );

const clearScoreCountsTable = () => getDB().delete(scoreCounts);

/*
 * for showing the list of deckSizes to filter by
 * */
const getDeckSizeList = () =>
  getDB()
    .select({ deckSize: scoreCounts.deckSize })
    .from(scoreCounts)
    .orderBy(
      ...buildOrderBy(
        [DEFAULT_SORT_BY_COLUMNS_MAP[ScoreTableColumnEnum.deck_size]],
        scoreCounts,
      ),
    ) // sort by deckSize
    .execute()
    .then((counts) => counts.map(({ deckSize }) => deckSize));

const createScoreCount = async ({ deckSize, mismatches, gameTimeDs }: Score) =>
  getDB()
    .insert(scoreCounts)
    .values({
      createdAt: Date.now(),
      deckSize: deckSize,
      worseThanOurMismatchesMap: `{${mismatches}: 0}`, // 0 other scores worse than ours, since we're the only score
      worseThanOurGameTimeMap: `{${gameTimeDs}: 0}`, // 0 other scores worse than ours, since we're the only score
      totalScores: 1,
    })
    .returning()
    .then((newCounts) => newCounts[0]);

const getManyScoreCountsByDeckSize = async (deckSizes: number[]) =>
  getAllScoreCounts().where(inArray(scoreCounts.deckSize, deckSizes));

const getOneScoreCountByDeckSize = async (deckSize: number) =>
  getAllScoreCounts()
    .where(eq(scoreCounts.deckSize, deckSize))
    .then((count) => count[0]);

// const updateScoreCountById = async (id: number, update: InsertScoreCount) =>
//   getDB()
//     .update(scoreCounts)
//     .set(update)
//     .where(eq(scoreCounts.id, id))
//     .returning()
//     .then((counts) => counts[0]);

const updateScoreCountByDeckSize = async (update: InsertScoreCount) =>
  getDB()
    .update(scoreCounts)
    .set(update)
    .where(eq(scoreCounts.deckSize, update.deckSize))
    .returning()
    .then((counts) => counts[0]);

/*
 * adding a score to the list:
 * update all scores that are worse than our new score
 * e.g. our new score is 2, all worse scores are >2
 *   so all those scores should be incremented by 1
 * equal score: should do nothing
 * better score than ours: ours is worse so theirs should be incremented
 *
 * case: score does NOT already exist:
 *   better                  worse
 * e.g. we scored: 2 4       6 8 10; we are adding a score of 5
 * worse than us:  4 3       2 1 0
 *              insert  /5\
 * (same) so all scores better than new score now have another worse score than them, so they increment by 1
 *     2 and 4 increment by 1 (to 5 and 4)
 * (same) all scores worse than new score are unaffected, so 6, 8, 10 stay how they are
 *
 * (diff) since 5 didn't exist, we now add it in, and score is equal to count of worse scores, which should be 3 (e.g. 6, 8, and 10)
 *  -- so if score did NOT exist, we need to add the score key (5), and set the value to 1 + 1 + 1 == 3
 *     5 => worseScores[new4Score] - 1 === 3;
 *     or 5 => worseScores[prev4Score] === 3
 *
 *
 *
 * case: score already exists:
 *  better                     worse
 * e.g. we had 2   4   6 8 10; we are adding a score of 4
 *       insert   /4\
 * (same) so all scores better than new score now have another worse score than them, so they increment by 1
 *     2 => 4 + 1 === 5
 * (same) all scores worse than new score are unaffected, so 6, 8, and 10 stay how they are
 *
 * (diff) since 4 did already exist, we need to only increment scores ABOVE 4, which we already did earlier
 *  -- so if score already existed, no extra work is needed for this step
 *
 *
 * How do do this programmatically?
 * sort entries by score, lowest (best) first
 * step through each score
 * newScore === 5
 * e.g. i === 2, 4, 6, 8, 10
 *
 * let nextBetterCount = score[i] // score[2] === 4
 * let added = false;
 * if newScore > i { // ours is worse
 *    score[i] += 1 // increment scores that are better than ours
 *    nextBetterCount = score[i] // 4, 3
 * } else if (newScore === i) {
 *   // if EQUAL, do nothing except mark that it is added
 *   added = true;
 * } else if (newScore < i) { // ours is better than current
 *   // do nothing
 *   save current with preexisting value
 * }
 *
 * // if NOT EQUAL/FOUND, then we haven't seen it yet, so we need to add it
 * if (!added) {
 *   score[newScore] = nextBetterCount
 * }
 *
 *
 *
 * */

/* e.g.
 * 0, 1, 0, 1, 0,
 * sorted 0, 0, 0, 1, 1,
 *   1: 0 worse than it
 *   0: 2 worse than it
 *
 * add a score with 4 mismatches:
 * => 0, 0, 0, 1, 1, 4
 *   4: 0 worse than it
 *   1: 0 + 1
 *   0: 2 + 1
 *
 * add a score with 2 mismatches:
 * => 0, 0, 0, 1, 1, 2, 4
 *   4: 0,
 *   2: 0 + 1,
 *   1: 1 + 1,
 *   0: 3 + 1,
 *
 *
 *
 * 1, 4, 1, 0, 0
 * 0, 0, 1, 1, 4
 *   4: 0,
 *   1: 1,
 *   0: 3
 * add 3
 * => 0, 0, 1, 1, 3, 4
 *   4: 0, // no change
 *   3: 1, // new placement && prev value from below
 *   1: 2,     // incremented
 *   0: 4,     // incremented
 *
 * add 0
 * => 0, ...
 *   4: 0,
 *   3: 1,
 *   1: 2,
 *   0: 4, // no change && new placement
 *
 * add 1
 * => 0, 0, 0, 1, 1, 1, 3, 4
 *   4: 0,
 *   3: 1,
 *   1: 2, // no change && new placement
 *   0: 5, // incremented
 * total 8 scores, - score["0"] => 3 so we have 3 zero's
 *
 *
 * so:
 * if the score exists, increment all counts for scores that are less than the score (if they exist)
 * if it doesn't exist,
 *   copy the next-lowest-mismatches value (count), use this value as your count
 *   - this comes from the one just better than this score, before it is incremented. If doesn't exist (if this becomes higher) then we use the total - 1 as our count, since we will be the highest.
 *   then increment all counts for scores less than the new score (if they exist)
 *
 * so:
 * 1. slice the array to get all less than (better than) the new mismatches
 * 1.b. if our score DOES NOT exist in the original array, save the last value from our slice as our new score's count. If there is no slice, our count should be the old total of scores in this scoreCount. (Then we will +1 on the update to accomodate for this new score.)
 * 3. increment all values of the slice (if they exist)
 * 4. combine the remaining partial with the new score (if exists) with the slice (if it exists)
 *
 * */

/*
 * e.g. {'00:00:00': 1, '00:00:01': 2}
 * rules:
 * - should have one unique key for each unique timestamp
 * - if found the same gameTime, do nothing to the found gameTime
 *   - except do not add a new entry
 * - else,
 *   - add a new entry
 *   - value should be the highest value from times under ours
 *   - e.g. the value of the time just under ours
 * - should increment all values where gameTimes are greater than ours
 *
 *
 * - gameTime is worse than ours if it is higher
 * - percentile is comparing us to how many are WORSE than us (HIGHER)
 *
 * so each added gameTime should have a count of how many scores are WORSE than it (higher)
 * - so each time we add a gameTime, the value should be equal to
 *   the count of gameTimes HIGHER than it
 *   (go down one LOWER (BETTER) score and grab that value, and that's our NEW VALUE)
 * - When adding a score, we also need to adjust all the LOWER scores
 *   - all lower scores should be incremented, because we are adding a
 *     WORSE score above it
 * - combined, start at the next LOWER gameTime.
 *   - (Grab that value to be used as our new gameTime value.)
 *     - (if no value, use 0 as our new value. With 1 entry, 0 are worse than our score)
 *   - loop from this next LOWER gameTime to the end of LOWEST
 *     - increment the value of each
 *
 * What should the obj look like?
 * {10s: 5, 20s: 4, 30s: 3, 40s: 2, 50s: 1, 60s: 0}
 * (best)                                  (worst)
 * */

// TODO:
// finish more efficient version
// - don't really need to go through all, can go through only the ones WORSE than us
// - can reuse the entries that are better than our score
//
// also, could change how we calculate scores:
// - only increment the next highest/worse count
// - then when calculating scores, would need to go over all worse-than and total them
//   - then calculate percentile from that total
// - WARN: this will mean totals must be calculated from the worst up
//
//
// also probably don't need to sort again below if it stays in order
// - would need to insert in the loop so it's in the correct place
// this is the update function, so if we maintain order in here during updates, then
// we don't need to ever sort the json
//
//  can I just splice it in? still might need the total "worse" counts so I could know the correct counts I think?
//
//  NOTE:
//  walk the array from worst to best scores, counting the totals worse so far ?? or maybe not need the totals
//  find the index where mine will fit
//  NOTE:
//  if it's the BEST score, need the total to calculate e.g. total - 1, since mine is the only best
//  ->
//  if it's the WORST score, grab the next better score and increment it, nothing else changes
//  if it's not a new entry, grab the next better score and increment it, nothing else changes
//  ->
//  if it's a new entry and not the best, 
//  - have to grab the next BETTER score and use it for my score,
//  - and next better score count becomes 1, since mine is the only one score directly worse
//
//

//
// const updateWorseThanOurScoreJson2 = (
//   score: Score,
//   total: number,
//   oldJson: LessThanOurScoreObj,
//   key: "gameTimeDs" | "mismatches",
// ) => {
//   const newLessThanOurScoreJson: LessThanOurScoreObj = {};
//   const sortedEntries = Object.entries(oldJson)
//     .map(([k, v]) => [Number(k), v])
//
//   const ourScore = score[key];
//
//   // handle 1 length case:
//   if (sortedEntries.length === 1) {
//     const [currentScore] = sortedEntries[0];
//     if (ourScore > currentScore) {
//       // ours is higher (worse)
//       // so their number should increase
//       // and we should have 0
//       // and theirs should be first
//       newLessThanOurScoreJson[currentScore] = 1;
//       newLessThanOurScoreJson[ourScore] = 0;
//       // nextBetterCount = currentLessThanCount;
//     } else {
//       if (ourScore < currentScore) {
//         // ours is better so we have 1 that is worse
//         newLessThanOurScoreJson[ourScore] = 1;
//       }
//       // old score (or equal score) gets appended next, with 0
//       // (it's either worse than ours or equal to ours)
//       newLessThanOurScoreJson[currentScore] = 0;
//     }
//     return newLessThanOurScoreJson;
//   }
//
//   let nextBetterCount = total;
//   let isNeedToInsert = true;
//
//   // TODO: handle >1 length case
//   // grab current and previous datas
//   // increment only the next better score (it is higher than us)
//   // - that will let us reduce the size of json, would then need to total the counts for the percentiles
//   // start from lowest score (best score)
//   // once we find a score that is worse or equal, we know where our score stands
//   // - then increment the prev score's counts by 1 to indicate there is now one more worse than it
//   // when breaking, use the index to find where to splice from the untouched part to patch it on afterwards
//
//   // maybe just try to use splice???
//   // indexOf to find index where score matches
//   // then go back one index to find next better (lower) score to increment it
//   // or if needed, splice in our new record for our new score if it didn't exist
//
//   // TODO: handle case where ours is the highest score, aka better than [0]
//
//   const [bestScore, bestCount] = sortedEntries[0];
//   if (ourScore < bestScore) { // ours is the best, so need to get our total
//     // need to determine how many scores are in the next worse score
//     // i think sum up all scores from [1] to the end, and subtract from total
//     const ourTotal = total - sortedEntries.slice(1).reduce((accum, [_, count]) => accum + count, 0);
//
//     //then can append the entire array, or unshift ours and return the entire thing
//
//     sortedEntries.unshift([ourScore, ourTotal]);
//     return sortedEntries;
//   }
//
//   // maybe should walk backwards through the array?, so then I can always have the total
//   // then it's simple to find out the next counts
//
//   let i = 1; // start at 1 and 0 for cur/prev
//   
//   while(i < sortedEntries.length) {
//     const [prevScore, prevCount] = sortedEntries[i - 1];
//     const [curScore, curCount] = sortedEntries[i];
//
//     console.assert(prevScore < curScore, "it's not sorted properly");
//     //if (ourScore < curScore && ourScore < prevScore) {
//     //  // ours is best
//     //  newLessThanOurScoresObj[ourScore] = total - (sum of all below);
//     //}
//
//     if (ourScore > curScore && ourScore > prevScore) {
//       // do nothing? aka insert same value
//       newLessThanOurScoreObj[curScore] = curCount;
//
//     } else if (ourScore === curScore && ourScore > prevScore) {
//       // prev score is better than ours, and cur score is the same
//       // increment curScore
//       
//
//     } else if (ourScore > curScore && ourScore < prevScore) {
//       // we are in between, our score is better than prevScore but worse than curScore
//       // curScore has to increment
//
//     } else {
//       // TODO:
//
//       break; // break the loop since nothing else to do
//     }
//
//
//     i++;
//   }
//
//   // TODO:
//   // loop will break , and we can combine the untouched part and the modified part and it should keep in same order
//
//   const priorHalf = newLessThanOurScoreJson.push([score[key], nextBetterCount]);
//   const latterHalf = sortedEntries.slice(i);
//
//   return priorHalf.concat(latterHalf);
//
// }

// something like O(n*5)? map, sort, for, map, sort
// could be more like O(n)
const updateWorseThanOurScoreMap = (
  score: Score,
  total: number,
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), v])
    .sort(([scoreA], [scoreB]) => scoreA - scoreB);

  let nextBetterCount = total;
  let isNeedToInsert = true;

  for (let i = 0; i < sortedEntries.length; i++) {
    const [thisScore, thisLessThanCount] = sortedEntries[i];

    if (score[key] > thisScore) {
      newLessThanOurScoreJson[thisScore] = thisLessThanCount + 1;
      nextBetterCount = thisLessThanCount;
    } else if (score[key] < thisScore) {
      // do nothing
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    } else {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    }
  }

  if (isNeedToInsert) {
    newLessThanOurScoreJson[score[key]] = nextBetterCount;
    const final = Object.entries(newLessThanOurScoreJson)
      .map(([k, v]) => [Number(k), v])
      .sort(([scoreA], [scoreB]) => scoreA - scoreB);
    return JSON.stringify(Object.fromEntries(final));
  }

  return JSON.stringify(newLessThanOurScoreJson);
};

/*
 * */

const addScoreToExistingCount = (
  {
    deckSize,
    totalScores,
    worseThanOurMismatchesMap,
    worseThanOurGameTimeMap,
  }: ScoreCount,
  score: Score,
) =>
  updateScoreCountByDeckSize({
    deckSize: deckSize,
    worseThanOurMismatchesMap: updateWorseThanOurScoreMap(
      score,
      totalScores,
      worseThanOurMismatchesMap,
      "mismatches",
    ),
    worseThanOurGameTimeMap: updateWorseThanOurScoreMap(
      score,
      totalScores,
      worseThanOurGameTimeMap,
      "gameTimeDs",
    ),
    totalScores: totalScores + 1,
    createdAt: Date.now(),
  });

// in the end, we will end up with 52 - 6 = 46 / 2 + 1 = 24 different deckSizes
const saveScoreToCount = async (score: Score) => {
  const foundOneScoreCount = await getOneScoreCountByDeckSize(score.deckSize);
  return foundOneScoreCount
    ? addScoreToExistingCount(foundOneScoreCount, score)
    : createScoreCount(score);
};

const scoreCountService = {
  getAll: getAllScoreCounts,
  getDeckSizes: getDeckSizeList,
  getByDeckSize: getManyScoreCountsByDeckSize,
  clear: clearScoreCountsTable,
  /*
   * the main way to add a score: also updates the scoreCounts
   *  - creates Score
   *  - creates or updates ScoreCounts
   * */
  saveScoreToCount,
};
export default scoreCountService;
