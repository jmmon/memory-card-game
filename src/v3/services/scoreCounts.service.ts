import { eq, inArray } from "drizzle-orm";
import { scoreCounts } from "../db";
import {
  ScoreTableColumnEnum,
  SortDirectionEnum,
  type LessThanOurScoreObj,
} from "../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import type { CountsQueryProps, DrizzleDb } from "./types";
import type { NewScoreCounts, Score, ScoreCounts } from "../db/types";
import { buildOrderBySqlStringWrapped } from "./score.service";

const getAllScoreCounts = (db: DrizzleDb) => db.select().from(scoreCounts);

const queryScoreCounts = (
  db: DrizzleDb,
  {
    deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
    sortDirection = DEFAULT_QUERY_PROPS.sortDirection,
  }: Partial<CountsQueryProps>,
) =>
  db
    .select()
    .from(scoreCounts)
    .where(inArray(scoreCounts.deckSize, deckSizesFilter))
    .orderBy(
      buildOrderBySqlStringWrapped([
        {
          column: ScoreTableColumnEnum.deck_size,
          direction: sortDirection,
        },
      ]),
    )
    .execute();

const clearScoreCountsTable = (db: DrizzleDb) => db.delete(scoreCounts);

/*
 * for showing the list of deckSizes to filter by
 * */
const getDeckSizeList = (db: DrizzleDb) =>
  db
    .select({ deckSize: scoreCounts.deckSize })
    .from(scoreCounts)
    .orderBy(
      buildOrderBySqlStringWrapped([
        {
          column: ScoreTableColumnEnum.deck_size,
          direction: SortDirectionEnum.asc,
        },
      ]),
    ) // sort by deckSize
    .execute()
    .then((set) => set.map(({ deckSize }) => deckSize)) // map to number[]
    .then((deckSizes) => deckSizes.filter((each) => each !== null) as number[]); // filter null

const createScoreCounts = async (db: DrizzleDb, score: Score) => {
  return (
    (
      await // @ts-ignore
      db
        .insert(scoreCounts)
        .values({
          createdAt: Date.now(),
          deckSize: score.deckSize,
          worseThanOurMismatchesMap: JSON.stringify({
            [score.mismatches]: 0,
          }),
          worseThanOurGameTimeMap: JSON.stringify({
            [score.gameTimeDs]: 0,
          }),
          // WARNING: for relations, this is causing TS error! scores relation does not exist on scoreCounts
          totalScores: 1,
        })
        .returning()
    )[0]
  );
};

const getScoreCountsByDeckSize = async (db: DrizzleDb, deckSizes: number[]) =>
  db.select().from(scoreCounts).where(inArray(scoreCounts.deckSize, deckSizes));

const updateScoreCountsById = async (
  db: DrizzleDb,
  id: number,
  update: NewScoreCounts,
) =>
  (
    await db
      .update(scoreCounts)
      .set(update)
      .where(eq(scoreCounts.id, id))
      .returning()
  )[0];

const updateScoreCountsByDeckSize = async (
  db: DrizzleDb,
  deckSize: number,
  update: NewScoreCounts,
) =>
  (
    await db
      .update(scoreCounts)
      .set(update)
      .where(eq(scoreCounts.deckSize, deckSize))
      .returning()
  )[0];

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

const updateWorseThanOurMismatchesJson = (
  score: Score,
  total: number,
  oldJson: LessThanOurScoreObj,
) => {
  let resultObj: LessThanOurScoreObj = {};
  const sortedOldJsonEntries = Object.entries(oldJson)
    .map(([k, v]) => [Number(k), Number(v)])
    .sort(([mismatchesA], [mismatchesB]) => mismatchesA - mismatchesB);
  // console.log("sorted by mismatches ascending:", sortedOldJsonEntries);

  let nextBetterCount = total;
  let isNeedToInsert = true;

  // looping from worst scores to best scores
  for (let i = 0; i < sortedOldJsonEntries.length; i++) {
    const [thisMismatches, thisCount] = sortedOldJsonEntries[i];

    if (score.mismatches > thisMismatches) {
      resultObj[thisMismatches] = thisCount + 1;

      // save the old score in case it's just above our new one
      nextBetterCount = thisCount;
    } else if (score.mismatches < thisMismatches) {
      // we did better than this score
      // this score did not lift
      resultObj[thisMismatches] = thisCount; // don't change the worse score, it did not improve
    } else if (thisMismatches === score.mismatches) {
      // if same score is found, we just keep the previous score
      isNeedToInsert = false;
      resultObj[thisMismatches] = thisCount; // don't change the worse score
    }
  }

  if (isNeedToInsert) {
    resultObj[score.mismatches] = nextBetterCount;
    // sort for looks, unnecessary
    resultObj = Object.fromEntries(
      Object.entries(resultObj)
        .map(([k, v]) => [Number(k), Number(v)])
        .sort(([mismatchesA], [mismatchesB]) => mismatchesA - mismatchesB),
    );
  }

  return resultObj;
};

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

const updateWorseThanOurGameTimeJson = (
  score: Score,
  total: number,
  oldJson: LessThanOurScoreObj,
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const entries = Object.entries(oldJson)
    .map(([k, v]) => [Number(k), Number(v)])
    .sort(([timeA], [timeB]) => timeA - timeB);

  let nextBetterCount = total;
  let isNeedToInsert = true;

  for (let i = 0; i < entries.length; i++) {
    const [thisGameTime, thisLessThanCount] = entries[i].map(Number);

    if (score.gameTimeDs > thisGameTime) {
      newLessThanOurScoreJson[Number(thisGameTime)] = thisLessThanCount + 1;
      nextBetterCount = thisLessThanCount;
    } else if (score.gameTimeDs < thisGameTime) {
      // do nothing
      newLessThanOurScoreJson[Number(thisGameTime)] = thisLessThanCount;
    } else {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreJson[Number(thisGameTime)] = thisLessThanCount;
    }
  }

  if (isNeedToInsert) {
    newLessThanOurScoreJson[score.gameTimeDs] = nextBetterCount;
    const final = Object.entries(newLessThanOurScoreJson)
      .map(([k, v]) => [Number(k), Number(v)])
      .sort(([timeA], [timeB]) => timeA - timeB);
    return Object.fromEntries(final);
  }
  return newLessThanOurScoreJson;
};

/*
 * */

const addScoreToExistingCounts = async (
  db: DrizzleDb,
  foundOneScoreCounts: ScoreCounts,
  score: Score,
) => {
  const updatedWorseThanMismatches = updateWorseThanOurMismatchesJson(
    score,
    foundOneScoreCounts.totalScores,
    JSON.parse(foundOneScoreCounts.worseThanOurMismatchesMap),
  );
  const updatedWorseThanGameTime = updateWorseThanOurGameTimeJson(
    score,
    foundOneScoreCounts.totalScores,
    JSON.parse(foundOneScoreCounts.worseThanOurGameTimeMap),
  );

  return updateScoreCountsById(db, foundOneScoreCounts.id, {
    createdAt: Date.now(),
    deckSize: foundOneScoreCounts.deckSize,
    worseThanOurMismatchesMap: JSON.stringify(updatedWorseThanMismatches),
    worseThanOurGameTimeMap: JSON.stringify(updatedWorseThanGameTime),
    totalScores: foundOneScoreCounts.totalScores + 1,
  });
};

// in the end, we will end up with 52 - 6 = 46 / 2 + 1 = 24 different deckSizes
const saveScoreToCounts = async (db: DrizzleDb, score: Score) => {
  // console.log("saveScoreToCounts:", { score });
  const foundOneScoreCounts = (
    await getScoreCountsByDeckSize(db, [score.deckSize])
  )[0] as ScoreCounts | undefined;

  // console.log("saveScoreToCounts:", { foundOneScoreCounts });

  if (foundOneScoreCounts === undefined) {
    // creating a new scoreCounts
    return createScoreCounts(db, score);
  } else {
    // update worseThanOurScoreJson: for all keys greater than our score, increment the values by 1
    return addScoreToExistingCounts(db, foundOneScoreCounts, score);
  }
};

const scoreCountsService = {
  clear: clearScoreCountsTable,
  query: queryScoreCounts,
  getDeckSizes: getDeckSizeList,
  create: createScoreCounts,
  getByDeckSize: getScoreCountsByDeckSize,
  updateById: updateScoreCountsById,
  addScoreToCountsById: addScoreToExistingCounts,
  updateByDeckSize: updateScoreCountsByDeckSize,
  // /*
  //  * the main way to add a score: also updates the scoreCounts
  //  *  - creates Score
  //  *  - creates or updates ScoreCounts
  //  * */
  saveScore: saveScoreToCounts,
  getAll: getAllScoreCounts,
};
export default scoreCountsService;
