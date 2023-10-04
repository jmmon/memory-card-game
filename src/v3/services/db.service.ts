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
import { timestampToMs } from "../utils/formatTime";
import { roundToDecimals } from "../components/game-header/game-header";

/*
 * These functions are wrapped with server$() before exported, so
 * they will always execute on the server, since they are db calls.
 * They can be called directly from the exported object from the client.
 * */

const calculatePercentile = ({
  total,
  lessThanCount,
  nextHighestLessThanCount,
}: {
  total: number;
  lessThanCount: number;
  nextHighestLessThanCount: number;
}) => {
  const avg = (lessThanCount + nextHighestLessThanCount) / 2;
  const percentile = (avg / total) * 100;
  if (isNaN(percentile)) return 0;
  return roundToDecimals(percentile, 2);
};

const generateScoreWithPercentiles = (
  score: Score,
  entriesLtGameTimeObjSortedDesc: Array<[string, number]>,
  entriesLtMismatchesObjSortedDesc: Array<[string, number]>,
  ltGameTimeObjSortedDesc: LessThanOurScoreObj,
  ltMismatchesObjSortedDesc: LessThanOurScoreObj,
  total: number
) => {
  // get next lt game time count, so we can average between ours and the next better
  const nextGameTimeIndex =
    entriesLtGameTimeObjSortedDesc.findIndex(
      ([gameTime]) => gameTime === (score.gameTime as string)
    ) - 1;
  const nextLtGameTimeCount =
    entriesLtGameTimeObjSortedDesc?.[nextGameTimeIndex]?.[1] ?? total;

  // get next lt mismatches count
  const nextMismatchIndex =
    entriesLtMismatchesObjSortedDesc.findIndex(
      ([mismatches]) => Number(mismatches) === (score.mismatches as number)
    ) - 1;
  const nextLtMismatchCount =
    entriesLtMismatchesObjSortedDesc?.[nextMismatchIndex]?.[1] ?? total;

  const timePercentileObj = {
    total,
    lessThanCount: ltGameTimeObjSortedDesc[score.gameTime as string],
    nextHighestLessThanCount: nextLtGameTimeCount,
  };
  const thisTimePercentile = calculatePercentile(timePercentileObj);
  // console.log({ timePercentileObj, thisTimePercentile });

  // calculate mismatch percentile
  const mismatchPercentileObj = {
    total,
    lessThanCount: ltMismatchesObjSortedDesc[score.mismatches as number],
    nextHighestLessThanCount: nextLtMismatchCount,
  };
  const thisMismatchPercentile = calculatePercentile(mismatchPercentileObj);
  // console.log({ mismatchPercentileObj, thisMismatchPercentile });

  return {
    ...score,
    timePercentile: thisTimePercentile,
    mismatchPercentile: thisMismatchPercentile,
  } as ScoreWithPercentiles;
};

const calculatePercentilesForScores = (
  scores: Score[],
  counts: ScoreCounts
) => {
  const entriesLtGameTimeObjSortedDesc = Object.entries(
    counts.worseThanOurGameTimeMap as LessThanOurScoreObj
  ).sort((a, b) => timestampToMs(a[0]) - timestampToMs(b[0]));

  const ltGameTimeObjSortedDesc = Object.fromEntries(
    entriesLtGameTimeObjSortedDesc
  ) as LessThanOurScoreObj;

  const entriesLtMismatchesObjSortedDesc = Object.entries(
    counts.worseThanOurMismatchesMap as LessThanOurScoreObj
  ).sort((a, b) => Number(a[0]) - Number(b[0]));

  const ltMismatchesObjSortedDesc = Object.fromEntries(
    entriesLtMismatchesObjSortedDesc
  ) as LessThanOurScoreObj;

  const total = counts.totalScores as number;

  // console.log({ ltGameTimeObjSortedDesc, ltMismatchesObjSortedDesc, total });

  return scores.map((score) =>
    generateScoreWithPercentiles(
      score,
      entriesLtGameTimeObjSortedDesc,
      entriesLtMismatchesObjSortedDesc,
      ltGameTimeObjSortedDesc,
      ltMismatchesObjSortedDesc,
      total
    )
  );
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
    const value = (b.pairs ?? 0) - (a.pairs ?? 0);
    return value;
  },
  timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = (b.timePercentile ?? 0) - (a.timePercentile ?? 0);
    return value;
  },
  mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = (b.mismatchPercentile ?? 0) - (a.mismatchPercentile ?? 0);
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
      nextKeyIndex++;
    }
    return direction === "desc" ? value : 0 - value;
  });

  return result;
};

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
  console.log('fresh from query:', {allScores});

  let allScoresWithPercentiles: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {};

  // run the calculations for each deck size
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

export default serverDbService;
