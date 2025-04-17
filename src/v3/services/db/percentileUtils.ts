import { Score, ScoreCount } from "~/v3/db/schemas/types";
import { LessThanOurScoreObj, ScoreWithPercentiles, ScoresByDeckSize } from "~/v3/types/types";
import { roundToDecimals } from "~/v3/utils/formatTime";

// this is puting the number in the middle of the percentile range than the lower end
const calculatePercentile = (total: number, lessThanCount: number) => {
  const percentile = (lessThanCount / total) * 100;
  if (isNaN(percentile)) return 0;
  return roundToDecimals(percentile, 2);
};

const buildScoreWithPercentiles = (
  score: Score,
  ltGameTimeObjSortedAscByScore: LessThanOurScoreObj,
  ltMismatchesObjSortedAscByScore: LessThanOurScoreObj,
  total: number,
) =>
  ({
    ...score,
    timePercentile: calculatePercentile(
      total,
      ltGameTimeObjSortedAscByScore[score.gameTimeDs], // v2 would need the sum here
    ),
    mismatchPercentile: calculatePercentile(
      total,
      ltMismatchesObjSortedAscByScore[score.mismatches],
    ),
  }) as ScoreWithPercentiles;

// const serverSortFunctions: {
//   [key: string]: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => number;
// } = {
//   initials: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.initials.localeCompare(a.initials);
//     return value;
//   },
//   deck_size: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.deckSize - a.deckSize;
//     return value;
//   },
//   pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.pairs - a.pairs;
//     return value;
//   },
//   // timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//   //   const value = (b.timePercentile ?? 0) - (a.timePercentile ?? 0);
//   //   return value;
//   // },
//   // mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//   //   const value = (b.mismatchPercentile ?? 0) - (a.mismatchPercentile ?? 0);
//   //   return value;
//   // },
//   game_time_ds: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.gameTimeDs - a.gameTimeDs;
//     return value;
//   },
//   mismatches: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.mismatches - a.mismatches;
//     return value;
//   },
//   created_at: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
//     const value = b.createdAt - a.createdAt;
//     return value;
//   },
// };

// const sortScores = (
//   scores: ScoreWithPercentiles[],
//   sortByColumnHistory: Array<SortColumnWithDirection>,
// ) => {
//   const result = [...scores];
//
//   try {
//     console.log("sorting fetched scores:", {
//       sortByColumnHistory,
//       sortFnKeys: Object.keys(serverSortFunctions),
//     });
//     result.sort((a, b) => {
//       let value = 0;
//       let nextKeyIndex = 0;
//       let { column } = sortByColumnHistory[0];
//       const { direction } = sortByColumnHistory[0];
//
//       // hits each sort function until it finds a non-zero value
//       while (value === 0 && nextKeyIndex < sortByColumnHistory.length) {
//         const sortingInstructions = sortByColumnHistory[nextKeyIndex];
//         column = sortingInstructions.column;
//
//         const sortFunction = serverSortFunctions[column];
//         value = sortFunction(a, b);
//         nextKeyIndex++;
//       }
//       return direction === SortDirectionEnum.desc ? value : 0 - value;
//     });
//   } catch (err) {
//     console.log("sorting fetched scores error:", { err });
//   }
//
//   console.log("sorted scores:", {
//     first: scores[0],
//     last: scores[scores.length - 1],
//   });
//   return result;
// };
// sortScores;


export const calculatePercentilesWhileMaintainingOrder = (
  allScores: Score[],
  allScoreCounts: ScoreCount[],
) => {

  const { scoresByDeckSize, orderedListOfScoreIds } = allScores.reduce(
    (
      mappers: {
        scoresByDeckSize: ScoresByDeckSize;
        orderedListOfScoreIds: number[];
      },
      curScore,
    ) => {
      // organize by deckSize:
      if (!mappers.scoresByDeckSize[curScore.deckSize]) {
        mappers.scoresByDeckSize[curScore.deckSize] = [curScore];
      } else {
        mappers.scoresByDeckSize[curScore.deckSize].push(curScore);
      }
      // maintain ID order
      mappers.orderedListOfScoreIds.push(curScore.id);
      return mappers;
    },
    { scoresByDeckSize: {}, orderedListOfScoreIds: [] },
  );

  const allScoresWithPercentilesByScoreId: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {}; // could also calc from mappers
  // calculate percentiles for each deckSize
  for (let i = 0; i < allScoreCounts.length; i++) {
    const {
      deckSize,
      totalScores,
      worseThanOurMismatchesMap,
      worseThanOurGameTimeMap,
    } = allScoreCounts[i];

    totals[deckSize] = totalScores;

    scoresByDeckSize[deckSize].forEach((score) => {
      // set to the allScoresWithPercentiles by scoreId
      // so we can pull them back out in-order according to our orderedList
      allScoresWithPercentilesByScoreId[score.id] = buildScoreWithPercentiles(
        score,
        JSON.parse(worseThanOurGameTimeMap),
        JSON.parse(worseThanOurMismatchesMap),
        totalScores,
      );
    });
  }

  const reorderedScores = orderedListOfScoreIds.map(
    (id) => allScoresWithPercentilesByScoreId[id],
  );
  return {
    scores: reorderedScores,
    // scores: sortScores(allScoresWithPercentiles, sortByColumnHistory),
    totals,
  };
};


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


// something like O(n*5)? map, sort, for, map, sort
// could be more like O(n)
export const updateWorseThanOurScoreMap = (
  score: Score,
  total: number, // previous total, since this is run before the update to the scoreCounts
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  )
    .map(([k, v]) => [Number(k), v])
    // .sort(([scoreA], [scoreB]) => scoreA - scoreB); // don't need to sort here since it's already sorted

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
