import type { Score, ScoreCount } from "~/v3/db/schemas/types";
import type {
  LessThanOurScoreObj,
  ScoreWithPercentiles,
  ScoresByDeckSize,
} from "~/v3/types/types";
import { roundToDecimals } from "~/v3/utils/formatTime";

// this is puting the number in the middle of the percentile range than the lower end
export const calculatePercentile = (total: number, lessThanCount: number) => {
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

export const updateWorseThanOurScoreMap_Orig = (
  score: Score,
  total: number, // previous total, since this is run before the update to the scoreCounts
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  )
    // .map(([k, v]) => [Number(k), v])
    // .sort(([scoreA], [scoreB]) => scoreA - scoreB); // don't need to sort here since it's already sorted

  let nextBetterCount = total;
  let isNeedToInsert = true;
  const newScore = score[key];
  let thisScore = 0;
  let thisLessThanCount = 0;

  // from lowest scores to highest
  for (let i = 0; i < sortedEntries.length; i++) {
    thisScore = Number(sortedEntries[i][0]);
    thisLessThanCount = sortedEntries[i][1];

    if (newScore > thisScore) {
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
      // .map(([k, v]) => [Number(k), v])
      .sort(([scoreA], [scoreB]) => Number(scoreA) - Number(scoreB));
    return JSON.stringify(Object.fromEntries(final));
  }

  return JSON.stringify(newLessThanOurScoreJson);
};


// This is still the fastest! especially after some small modifications learned from the other revisions
export const updateWorseThanOurScoreMap = (
  score: Score,
  total: number, // previous total, since this is run before the update to the scoreCounts
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  );
  // no more map() so we save a bit of complexity

  let i = 0;
  let nextBetterCount = total;
  let isNeedToInsert = true;
  let thisScore = 0;
  let thisLessThanCount = 0;

  for (; i < sortedEntries.length; i++) {
    thisScore = Number(sortedEntries[i][0]);
    thisLessThanCount = sortedEntries[i][1];

    if (score[key] > thisScore) {
      newLessThanOurScoreJson[thisScore] = thisLessThanCount + 1;
      nextBetterCount = thisLessThanCount;
    } else {if (score[key] === thisScore) {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    } else {
      // do nothing
      newLessThanOurScoreJson[thisScore] = thisLessThanCount;
    }
    }
  }
  // time: loops through everything once

  // if not already found (gets LESS LIKELY as we get more scores)
  if (isNeedToInsert) {
    newLessThanOurScoreJson[score[key]] = nextBetterCount;
    // have to sort so our inserted score gets in the correct spot
    const final = Object.entries(newLessThanOurScoreJson)
      .sort(([scoreA], [scoreB]) => Number(scoreA) - Number(scoreB));
    return JSON.stringify(Object.fromEntries(final));
  }

  return JSON.stringify(newLessThanOurScoreJson);
};
// only one (rarely two) loops per score
// 10_000 scores:
// e.g. 6.89% saved mismatches
// and 3.32%  saved gameTime
//
//e.g. 2.52% mismatches
//5.19% gametime
//2.89% mismatches
//4.57% gametime
//4.08 mismatches, 3.34% gametime!
//consistently slightly better!!



// the intention for this is to use same methods as v2 but duplicate v1 functionality
// as in will be more optimized v1, without going through entire array and
// without doing extra sorting and mapping
/*
 *
 * {10s: 5, 20s: 4, 30s: 3, 40s: 2, 50s: 1, 60s: 0}
 * (best)                                  (worst)
 * insert a 20s score =>
 * {10s: 6, 20s: 4, 30s: 3, 40s: 2, 50s: 1, 60s: 0}
 * only 10s incremented
 *
 * insert a 25s score =>
 * {10s: 7, 20s: 5, 25s: 4, 30s: 3, 40s: 2, 50s: 1, 60s: 0}
 * 25s adapts 20s score
 * 20s score increments by 1
 *
 * */
// WORKING!
// still slower...
export const updateWorseThanOurScoreMap_r1 = (
  score: Score,
  total: number,
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  );
  // console.log({ sortedEntries });
  // console.log(`~~ Inserting ${key} into entries:`, score[key]);

  let i = 0;
  let thisScore = Number(sortedEntries[i][0]);
  const newScore = score[key];
  if (newScore < thisScore) {
    // when inserting at the beginning, need to know how many total scores there are and use that number
    sortedEntries.unshift([String(newScore), total]);
    return JSON.stringify(Object.fromEntries(sortedEntries));
  }

  // from lowest scores to highest ( best to worst)
  for (i = 0; i < sortedEntries.length; i++) {
    thisScore = Number(sortedEntries[i][0]);
    if (thisScore < newScore) {
      sortedEntries[i][1] += 1; // increment all better (lesser) scores
    } else {
      break;
    }
  }
  // time: loop through average of half the counts
  // memory: no new arrays!


  // when inserting a new score (splice into it)
  // we are taking next item and incrementing its count
  // rather than taking prev item and using it as it is

  if (i === sortedEntries.length) {
    // append to end if we went through entire array
    // sortedEntries.push([String(newScore), 0]);
    sortedEntries[i] = ([String(newScore), 0]);
  } else if (thisScore > newScore) {
    // not the best, and not the worst
    // new score adapts prev score's old count (subtract 1 since we already added 1 above)
    const newCount = sortedEntries[i - 1][1] - 1;
    sortedEntries.splice(i, 0, [String(newScore), newCount]);
    // sortedEntries.copyWithin(i + 1, i)
    // sortedEntries[i] = [String(newScore), newCount ];
    //
    // const obj = Object.fromEntries(sortedEntries);
    // obj[newScore] = newCount;
    // const final = Object.entries( obj )
    //   .sort(([scoreA], [scoreB]) => Number(scoreA) - Number(scoreB));
    // return JSON.stringify(Object.fromEntries(final));
  }
  // time: unshift probably does a loop... splice probably does a loop...
  // memory: no more arrays!

  return JSON.stringify(Object.fromEntries(sortedEntries));
};







// revision 2!
//
// what I need to do is basically store the target index for the new item
// and if it needs to insert, then the later ones should be shifted to the right
//
// then at the end I can just insert the new item into the empty slot that was left at the targetIndex
//
//
// WORKING!
//
// still slower lol...
//
export const updateWorseThanOurScoreMap_r2 = (
  score: Score,
  total: number, // previous total, since this is run before the update to the scoreCounts
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreEntries: [number, number][] = [];
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  );
  // time: loops through everything once,
  // memory: creates a new array, creates new nested arrays

  let i = 0;
  let targetIndex = -1;
  let nextBetterCount = total;
  let thisScore = 0;
  let thisLessThanCount = 0;
  let isFound = false;
  const length = sortedEntries.length;

  for (; i < length; i++) {
    thisScore = Number(sortedEntries[i][0]);
    thisLessThanCount = sortedEntries[i][1];

    if (score[key] > thisScore) {
      // ours is worse, increment the existing score
      newLessThanOurScoreEntries[i] = [thisScore, thisLessThanCount + 1];
      nextBetterCount = thisLessThanCount;
      if (i === length - 1) {
        newLessThanOurScoreEntries[i + 1] = [score[key], 0] // insert if we're the worst score
      }
    } else if (score[key] === thisScore) {
      // equal
      isFound = true;
      newLessThanOurScoreEntries[i] = [thisScore, thisLessThanCount];
    
    } else if (score[key] < thisScore) {
      // ours is better, shift remaining over to make a slot if we wern't already found
      if (!isFound && targetIndex === -1) {
        targetIndex = i;
        // insert ours at this index on the first time we get there
        newLessThanOurScoreEntries[i] = [score[key], nextBetterCount];
      }
      const entry: [number, number] = [thisScore, thisLessThanCount];
      if (targetIndex !== -1) {
        // leave that slot since we already inserted
        newLessThanOurScoreEntries[i + 1] = entry;
      } else {
        // we've not yet inserted, so keep the same slot as original
        newLessThanOurScoreEntries[i] = entry;
      }
    }
  }


  return JSON.stringify(Object.fromEntries(newLessThanOurScoreEntries));
};





// uses entrys instead of an object.. still slower!!!
export const updateWorseThanOurScoreMap_r3 = (
  score: Score,
  total: number, // previous total, since this is run before the update to the scoreCounts
  oldJson: string,
  key: "gameTimeDs" | "mismatches",
) => {
  const newLessThanOurScoreEntries: [number, number][] = [];
  const sortedEntries = Object.entries(
    JSON.parse(oldJson) as Record<string, number>,
  );
  // time: loops through everything once,
  // memory: creates a new array, creates new nested arrays

  let i = 0;
  let nextBetterCount = total;
  let isNeedToInsert = true;
  let thisScore = 0;
  let thisLessThanCount = 0;

  for (; i < sortedEntries.length; i++) {
    thisScore = Number(sortedEntries[i][0]);
    thisLessThanCount = sortedEntries[i][1];

    if (score[key] > thisScore) {
      newLessThanOurScoreEntries[i] = [thisScore, thisLessThanCount + 1];
      nextBetterCount = thisLessThanCount;
    } else if (score[key] === thisScore) {
      // equal
      isNeedToInsert = false;
      newLessThanOurScoreEntries[i] = [thisScore, thisLessThanCount];
    } else {
      // do nothing
      newLessThanOurScoreEntries[i] = [thisScore, thisLessThanCount];
    }
  }
  // time: loops through everything once (again)

  // if not already found (gets less likely as we get more scores)
  let final = newLessThanOurScoreEntries;
  if (isNeedToInsert) {
    newLessThanOurScoreEntries[sortedEntries.length] = [score[key], nextBetterCount];
    final = newLessThanOurScoreEntries
      .sort(([scoreA], [scoreB]) => scoreA - scoreB);
  }
  return JSON.stringify(Object.fromEntries(final));
};
