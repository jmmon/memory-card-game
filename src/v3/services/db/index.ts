import { server$ } from "@builder.io/qwik-city";
import type { Score, InsertScore, ScoreCount } from "~/v3/db/schemas/types";
import type { ScoreQueryProps } from "./types";
import {
  // SortDirectionEnum,
  type LessThanOurScoreObj,
  type ScoreWithPercentiles,
  // type SortColumnWithDirection,
} from "../../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import scoreService from "./scores.service";
import scoreCountService from "./scoreCounts.service";
import { roundToDecimals } from "~/v3/utils/formatTime";
import { getDB } from "~/v3/db";
import logger from "../logger";
import { DebugTypeEnum, LogLevel } from "~/v3/constants/game";

/*
 * These functions are wrapped with server$() before exported, so
 * they will always execute on the server, since they are db calls.
 * They can be called directly from the exported object from the client.
 * */

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
      ltGameTimeObjSortedAscByScore[score.gameTimeDs],
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

const calculatePercentilesWhileMaintainingOrder = (
  allScores: Score[],
  allScoreCounts: ScoreCount[],
) => {
  const allScoresWithPercentilesByScoreId: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {};

  // save the order
  const orderedListOfScoreIds = allScores.map(({ id }) => id);

  for (let i = 0; i < allScoreCounts.length; i++) {
    const thisCounts = allScoreCounts[i];
    totals[thisCounts.deckSize] = thisCounts.totalScores;

    const scoresOfThisDeckSize = allScores.filter(
      ({ deckSize }) => deckSize === thisCounts.deckSize,
    );

    const worseThanOurMismatchesMapObj = JSON.parse(
      thisCounts.worseThanOurMismatchesMap,
    );
    const worseThanOurGameTimeMapObj = JSON.parse(
      thisCounts.worseThanOurGameTimeMap,
    );

    scoresOfThisDeckSize.forEach((score) => {
      // set to the allScoresWithPercentiles by scoreId so we can pull them back out using our list
      // key by id so order can be restored
      allScoresWithPercentilesByScoreId[score.id] = buildScoreWithPercentiles(
        score,
        worseThanOurGameTimeMapObj,
        worseThanOurMismatchesMapObj,
        thisCounts.totalScores,
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

/**
 * query scores according to the params
 * query counts according to the decksizes listed
 * calculate percentile scores
 *
 * return scores and totals of each deck size
 * */
const queryScoresAndCalculatePercentiles = async ({
  pageNumber = DEFAULT_QUERY_PROPS.pageNumber,
  resultsPerPage = DEFAULT_QUERY_PROPS.resultsPerPage,
  deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
  sortByColumnHistory = DEFAULT_QUERY_PROPS.sortByColumnHistory,
}: Partial<ScoreQueryProps>) => {
  logger(
    DebugTypeEnum.SERVICE,
    LogLevel.ONE,
    "queryScoresAndCalculatePercentiles",
  );
  // need the scores and the counts to calculate
  const [resScores, resCounts] = await Promise.allSettled([
    scoreService.query({
      pageNumber,
      resultsPerPage,
      deckSizesFilter,
      sortByColumnHistory,
    }),
    scoreCountService.getByDeckSize(deckSizesFilter),
  ]);

  // early return if error
  if (resScores.status !== "fulfilled" || resCounts.status !== "fulfilled") {
    console.log({ resScores, resCounts });
    const rejectedRes = [resScores, resCounts]
      .filter((res) => res.status === "rejected")
      .map((each) => JSON.stringify(each, null, 2));
    const message = "Error querying for " + rejectedRes.join(" and ");
    console.log({ message });
    return { scores: [], totals: {} };
  }

  const allScores = resScores.value;
  const scoreCounts = resCounts.value;
  console.log(
    "fresh from query:",
    allScores.map((score) => JSON.stringify(score)),
  );

  return calculatePercentilesWhileMaintainingOrder(allScores, scoreCounts);
};

const serverDbService = {
  scores: {
    getAll: server$(scoreService.getAll),
    queryWithPercentiles: server$(function (opts: Partial<ScoreQueryProps>) {
      // this.headers.set(
      //   "Cache-Control",
      //   "public, max-age=10, s-maxage=60",
      // );
      return queryScoresAndCalculatePercentiles(opts);
    }),
  },
  scoreCounts: {
    getDeckSizes: server$(scoreCountService.getDeckSizes),
    getAll: server$(scoreCountService.getAll),
  },
  // /*
  //  * the main way to add a score: also updates the scoreCounts
  //  *  - creates Score
  //  *  - creates or updates ScoreCounts
  //  * */
  saveNewScore: server$(async function (score: InsertScore) {
    const newScore = await scoreService.create(score);
    const newScoreCounts = await scoreCountService.saveScoreToCount(newScore);
    // console.log("saveNewScore:", { newScore, newScoreCounts });
    return { newScore, newScoreCounts };
  }),
  clearAllData: server$(() =>
    getDB().batch([scoreCountService.clear(), scoreService.clear()]),
  ),
};

export default serverDbService;
