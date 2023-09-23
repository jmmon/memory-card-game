import type { NewScore, Score, ScoreCounts } from "../db/types";
import { server$ } from "@builder.io/qwik-city";
import type {
  LessThanOurScoreObj,
  ScoreWithPercentiles,
  SortColumnWithDirection,
} from "../types/types";
import { DATE_JAN_1_1970 } from "../components/scores-modal/scores-modal";
import type { ScoreQueryProps } from "./types";
import { DEFAULT_QUERY_PROPS } from "./constants";

import scoreService from "./score.service";
import scoreCountsService from "./scoreCounts.service";
import CONSTANTS from "../utils/constants";

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
  if (isNaN(percentile)) return 0;
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
  // console.log({ counts, scores });
  const ltMismatchesObj =
    counts.worseThanOurMismatchesMap as LessThanOurScoreObj;
  const ltGameTimeObj = counts.worseThanOurGameTimeMap as LessThanOurScoreObj;
  const total = counts.totalScores as number;
  // console.log({ ltMismatchesObj, ltGameTimeObj, total });

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
    const value = (b.initials ?? "").localeCompare(a.initials ?? "");
    return value;
  },
  deckSize: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = (b.deckSize ?? 0) - (a.deckSize ?? 0);
    return value;
  },
  pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = (b.pairs ?? 0) - (a.pairs  ?? 0);
    return value;
  },
  timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.timePercentile  ?? 0) - (a.timePercentile  ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value =
      (b.mismatchPercentile ?? 0) -
      (a.mismatchPercentile ?? 0);
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
  const result = [...scores];

  result.sort((a, b) => {
    let value = 0;
    let nextKeyIndex = 0;
    let { column } = sortByColumnHistory[0];
    const { direction } = sortByColumnHistory[0];

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
  const [resScores, resCounts] = await Promise.allSettled([
    scoreService.query({
      pageNumber,
      resultsPerPage,
      deckSizesFilter,
      sortByColumnHistory,
    }),
    scoreCountsService.getByDeckSize(deckSizesFilter),
  ]);

  if (resScores.status !== "fulfilled" || resCounts.status !== "fulfilled") {
    console.log({ resScores, resCounts });
    const rejectedRes = [resScores, resCounts]
      .filter((res) => res.status === "rejected")
      .map((each) => JSON.stringify(each, null, 2));
    const message = "Error querying for " + rejectedRes.join(" and ");
    console.log({ message });
    return { scores: [], totals: {} };
  }

  const allScores = resScores.value as Score[];
  const counts = resCounts.value as ScoreCounts[];

  let allScoresWithPercentiles: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {};

  for (let i = 0; i < counts.length; i++) {
    const thisCounts = counts[i];
    const scores = allScores.filter(
      (score) => score.deckSize === thisCounts.deckSize
    );
    const scoresWithPercentiles = calculatePercentilesForScores(
      scores,
      thisCounts
    );
    allScoresWithPercentiles = allScoresWithPercentiles.concat(
      scoresWithPercentiles
    );

    totals[thisCounts.deckSize ?? CONSTANTS.CARD.COUNT] =
      thisCounts.totalScores ?? 0;
  }

  return {
    scores: sortScores(allScoresWithPercentiles, sortByColumnHistory),
    totals,
  };
};

const serverDbService = {
  scores: {
    clear: server$(scoreService.clear),
    query: server$(scoreService.query),
    getByDeckSize: server$(scoreService.getByDeckSize),
    create: server$(scoreService.create),
    getAll: server$(scoreService.getAll),
    queryWithPercentiles: server$(queryScoresAndCalculatePercentiles),
  },
  saveNewScore: server$(async (score: NewScore) => {
    const newScore = await scoreService.create(score);
    const newScoreCounts = await scoreCountsService.saveScore(
      newScore as Score
    );
    // console.log({newScore, newScoreCounts});
    return { newScore, newScoreCounts };
  }),

  scoreCounts: {
    clear: server$(scoreCountsService.clear),
    query: server$(scoreCountsService.query),
    getDeckSizes: server$(scoreCountsService.getDeckSizes),
    create: server$(scoreCountsService.create),
    getByDeckSize: server$(scoreCountsService.getByDeckSize),
    updateById: server$(scoreCountsService.updateById),
    addScoreToCountsById: server$(scoreCountsService.addScoreToCountsById),
    updateByDeckSize: server$(scoreCountsService.updateByDeckSize),
    getAll: server$(scoreCountsService.getAll),
    // /*
    //  * the main way to add a score: also updates the scoreCounts
    //  *  - creates Score
    //  *  - creates or updates ScoreCounts
    //  * */
    saveScore: server$(scoreCountsService.saveScore),
  },
  clearData: server$(async () => {
    await scoreCountsService.clear();
    await scoreService.clear();
    // Promise.all([scoreCountsService.clear(), scoreService.clear()])
  }),
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
