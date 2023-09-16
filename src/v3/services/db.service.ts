import type { Score, ScoreCounts } from "../db/types";
import { server$ } from "@builder.io/qwik-city";
import {
  LessThanOurScoreObj,
  ScoreWithPercentiles,
  SortColumnWithDirection,
} from "../types/types";
import { DATE_JAN_1_1970 } from "../components/scores-modal/scores-modal";
import { ScoreQueryProps } from "./types";
import { DEFAULT_QUERY_PROPS } from "./constants";

import scoreService from "./score.service";
import scoreCountsService from "./scoreCounts.service";

/*
 * These functions are wrapped with server$() before exported, so
 * they will always execute on the server, since they are db calls.
 * They can be called directly from the exported object from the client.
 * */

const calculatePercentile = ({
  total,
  lessThanCount,
}: {
  total: number;
  lessThanCount: number;
}) => {
  const percentile = (lessThanCount / total) * 100;
  return Math.round(percentile * 10) / 10;
};

const calculatePercentilesForOneScore = ({
  total,
  ltGameTimeCt,
  ltMismatchesCt,
}: {
  total: number;
  ltGameTimeCt: number;
  ltMismatchesCt: number;
}) => ({
  timePercentile: calculatePercentile({ total, lessThanCount: ltGameTimeCt }),
  mismatchPercentile: calculatePercentile({
    total,
    lessThanCount: ltMismatchesCt,
  }),
});

const calculatePercentilesForScores = (
  scores: Score[],
  counts: ScoreCounts
) => {
  const ltMismatchesObj =
    counts.lessThanOurMismatchesMap as LessThanOurScoreObj;
  const ltGameTimeObj = counts.lessThanOurGameTimeMap as LessThanOurScoreObj;
  const total = counts.totalScores as number;

  const scoresWithPercentiles = [];
  for (let i = 0; i < scores.length; i++) {
    scoresWithPercentiles.push({
      ...scores[i],
      ...calculatePercentilesForOneScore({
        total,
        ltGameTimeCt: ltGameTimeObj[scores[i].gameTime as string],
        ltMismatchesCt: ltMismatchesObj[scores[i].mismatches as number],
      }),
    });
  }

  return scoresWithPercentiles as ScoreWithPercentiles[];
};

const sortFunctions: {
  [key: string]: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => number;
} = {
  initials: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.initials as string) ?? "").localeCompare(
      (a.initials as string) ?? ""
    );
    return value;
  },
  deckSize: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.deckSize as number) ?? 0) - ((a.deckSize as number) ?? 0);
    return value;
  },
  pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = ((b.pairs as number) ?? 0) - ((a.pairs as number) ?? 0);
    return value;
  },
  timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      ((b.timePercentile as number) ?? 0) - ((a.timePercentile as number) ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      ((b.mismatchPercentile as number) ?? 0) -
      ((a.mismatchPercentile as number) ?? 0);
    return value;
  },
  createdAt: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.createdAt ?? DATE_JAN_1_1970).getTime() -
      (a.createdAt ?? DATE_JAN_1_1970).getTime();
    return value;
  },
};

const sortScores = (
  scores: ScoreWithPercentiles[],
  sortByColumnHistory: Array<SortColumnWithDirection>
) => {
  let result = [...scores];

  result.sort((a, b) => {
    let value = 0;
    let nextKeyIndex = 0;
    let { column, direction } = sortByColumnHistory[0];
    // console.log({ sortByColumnHistory: sortByColumnHistory.value });
    while (value === 0 && nextKeyIndex < sortByColumnHistory.length) {
      const sortingInstructions = sortByColumnHistory[nextKeyIndex];
      column = sortingInstructions.column;

      value = sortFunctions[column](a, b);
      // console.log({ value, key, fn });
      nextKeyIndex++;
    }
    // console.log({ value });
    return direction === "desc" ? value : 0 - value;
  });

  // console.log({ sortedResult: result });
  return result;
};

/* TODO:
 * this should look up the scoreCounts by deckSize
 * and then calculate percentiles for all the scores,
 * so everything is set for the frontend
 * */
const queryScoresAndCalculatePercentiles = async ({
  pageNumber = DEFAULT_QUERY_PROPS.pageNumber,
  resultsPerPage = DEFAULT_QUERY_PROPS.resultsPerPage,
  deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
  sortByColumnHistory = DEFAULT_QUERY_PROPS.sortByColumnHistory,
}: Partial<ScoreQueryProps>) => {
  const [resCounts, resScores] = await Promise.allSettled([
    scoreCountsService.query({
      deckSizesFilter,
    }),
    scoreService.query({
      pageNumber,
      resultsPerPage,
      deckSizesFilter,
      sortByColumnHistory,
    }),
  ]);

  if (resScores.status === "fulfilled" && resCounts.status === "fulfilled") {
    const scores = resScores?.value as Score[];
    const counts = resCounts?.value[0] as ScoreCounts;

    const scoresWithPercentiles = calculatePercentilesForScores(scores, counts);
    return sortScores(scoresWithPercentiles, sortByColumnHistory);
  }

  const rejectedRes = [resScores, resCounts].filter(
    (res) => res.status === "rejected"
  );
  const message = "Error querying for " + rejectedRes.join(" and ");
  console.log({ message });
  return [];
  // throw new Error(message);
};

// const serverify = (obj: { [key: string]: () => Promise<any> }) =>
//   Object.fromEntries(
//     Object.entries(obj).map(([key, fn]) => [key, server$(fn)])
//   );

const serverDbService = {
  scores: {
    query: server$(scoreService.query),
    getByDeckSize: server$(scoreService.getByDeckSize),
    create: server$(scoreService.create),
    getAll: server$(scoreService.getAll),
    queryWithPercentiles: server$(queryScoresAndCalculatePercentiles),
  },
  scoreCounts: {
    query: server$(scoreCountsService.query),
    getDeckSizes: server$(scoreCountsService.getDeckSizes),
    create: server$(scoreCountsService.create),
    getByDeckSize: server$(scoreCountsService.getByDeckSize),
    updateById: server$(scoreCountsService.updateById),
    addScoreToCountsById: server$(scoreCountsService.addScoreToCountsById),
    updateByDeckSize: server$(scoreCountsService.updateByDeckSize),
    // /*
    //  * the main way to add a score: also updates the scoreCounts
    //  *  - creates Score
    //  *  - creates or updates ScoreCounts
    //  * */
    saveScore: server$(scoreCountsService.saveScore),
  },
};

/*
 * ORRRRR
 * I have the scores saved by deck size, and related to the ScoreCounts table
 * I guess it's the same, except I would expand the scoreCounts schema to have an array of scores (of matching deckSize)
 * ...Scores...
 * ScoreCounts[] = {
 *    deckSize: 6 // or whatever
 *   lessThanOurMismatchesMap: { // for mismatches percentiles
 *     [mismatchCount: number]: m // m === how many scores have less mismatches than mismatchCount
 *   },
 *   lessThanOurGameTimeMap: { // for gameTime percentiles
 *     [gameTime: number]: t // t === how many scores have less gameTime than gameTime
 *   }
 *   // TODO: Could have this optimized?? Our gameTime is in the format of 00:00:00.000
 *   // Currently, we would be creating a new entry for every single different millisecond!
 *   // Alternately, could prune time to nearest tenth of second (rounded)?
 *   // Alternately, could make a tree structure e.g.:
 *   lessThanOurGameTimeMap: { // for gameTime percentiles
 *     [gameTimeHours: string]: {
 *     lessThanThisTime: t // t === how many scores have less gameTimeHours than ours
 *     [gameTimeMinutes: string]: {
 *     lessThanThisTime: t // t === how many scores have less gameTimeMinutes than ours
 *     [gameTimeSeconds: string]: {
 *     [gameTimeMilliseconds: string]: t // t === how many scores have less gameTime than ours
 *     }
 *     }
 *     }
 *   }
 *   // I don't think the tree structure would reduce the number of entries...
 *   // would it make it easier to query?
 *
 *   // scores: many(scores) // added below with relations()
 * }
 * const ScoreCountsRelations = relations(ScoreCounts, ({many}) => ({
 *   scores: many(Scores),
 * }))
 *
 * so then we would end up with up to 24 scoreCounts (one for each deckSize)
 * and we could find all scores from that deckSize
 *
 *
 *
 * When creating a new score, we need to update BOTH lessThanOurGameTimeMap and lessThanOurMismatchesMap
 * so it would be better to do this with one call, rather than doing two separate calls
 *
 * so create a score:
 *   add a new score
 *   update the ScoreCounts for this deckSize
 *
 * getScoresByDeckSize => calculate percentiles and return ScoreWithPercentiles?
 * */

export default serverDbService;
