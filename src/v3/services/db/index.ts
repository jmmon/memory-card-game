import { server$ } from "@builder.io/qwik-city";
import type { Score, InsertScore, ScoreCount } from "~/v3/db/schemas/types";
import type { ScoreQueryProps } from "./types";
import {
  SortDirectionEnum,
  type LessThanOurScoreObj,
  type ScoreWithPercentiles,
  type SortColumnWithDirection,
} from "../../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import scoreService from "./scores.service";
import scoreCountService from "./scoreCounts.service";
import { roundToDecimals } from "~/v3/utils/formatTime";
import { getDB } from "~/v3/db";

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
  entriesLtGameTimeObjSortedDesc: Array<[number, number]>,
  entriesLtMismatchesObjSortedDesc: Array<[number, number]>,
  ltGameTimeObjSortedDesc: LessThanOurScoreObj,
  ltMismatchesObjSortedDesc: LessThanOurScoreObj,
  total: number,
) => {
  // get next lt game time count, so we can average between ours and the next better
  const nextGameTimeIndex =
    entriesLtGameTimeObjSortedDesc.findIndex(
      ([gameTime]) => gameTime === score.gameTimeDs,
    ) - 1;
  const nextLtGameTimeCount =
    entriesLtGameTimeObjSortedDesc[nextGameTimeIndex]?.[1] ?? total;

  const timePercentileObj = {
    total,
    lessThanCount: ltGameTimeObjSortedDesc[score.gameTimeDs],
    nextHighestLessThanCount: nextLtGameTimeCount,
  };
  const thisTimePercentile = calculatePercentile(timePercentileObj);
  // console.log({ timePercentileObj, thisTimePercentile });

  // get next lt mismatches count
  const nextMismatchIndex =
    entriesLtMismatchesObjSortedDesc.findIndex(
      ([mismatches]) => mismatches === score.mismatches,
    ) - 1;
  const nextLtMismatchCount =
    entriesLtMismatchesObjSortedDesc[nextMismatchIndex]?.[1] ?? total;

  const mismatchPercentileObj = {
    total,
    lessThanCount: ltMismatchesObjSortedDesc[score.mismatches],
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
  {
    worseThanOurGameTimeMap,
    worseThanOurMismatchesMap,
    totalScores,
  }: ScoreCount,
) => {
  const entriesLtGameTimeObjSortedDesc = Object.entries(
    JSON.parse(worseThanOurGameTimeMap) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([timeA], [timeB]) => timeA - timeB);

  const ltGameTimeObjSortedDesc = Object.fromEntries(
    entriesLtGameTimeObjSortedDesc,
  ) as LessThanOurScoreObj;

  const entriesLtMismatchesObjSortedDesc = Object.entries(
    JSON.parse(worseThanOurMismatchesMap) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([mismatchesA], [mismatchesB]) => mismatchesA - mismatchesB);

  const ltMismatchesObjSortedDesc = Object.fromEntries(
    entriesLtMismatchesObjSortedDesc,
  ) as LessThanOurScoreObj;

  // console.log({ ltGameTimeObjSortedDesc, ltMismatchesObjSortedDesc, total });

  return scores.map((score) =>
    generateScoreWithPercentiles(
      score,
      entriesLtGameTimeObjSortedDesc,
      entriesLtMismatchesObjSortedDesc,
      ltGameTimeObjSortedDesc,
      ltMismatchesObjSortedDesc,
      totalScores,
    ),
  );
};

const serverSortFunctions: {
  [key: string]: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => number;
} = {
  initials: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.initials.localeCompare(a.initials);
    return value;
  },
  deck_size: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.deckSize - a.deckSize;
    return value;
  },
  pairs: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.pairs - a.pairs;
    return value;
  },
  // timePercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
  //   const value = (b.timePercentile ?? 0) - (a.timePercentile ?? 0);
  //   return value;
  // },
  // mismatchPercentile: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
  //   const value = (b.mismatchPercentile ?? 0) - (a.mismatchPercentile ?? 0);
  //   return value;
  // },
  game_time_ds: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.gameTimeDs - a.gameTimeDs;
    return value;
  },
  mismatches: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.mismatches - a.mismatches;
    return value;
  },
  created_at: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
    const value = b.createdAt - a.createdAt;
    return value;
  },
};

const sortScores = (
  scores: ScoreWithPercentiles[],
  sortByColumnHistory: Array<SortColumnWithDirection>,
) => {
  const result = [...scores];

  try {
    console.log("sorting fetched scores:", {
      sortByColumnHistory,
      sortFnKeys: Object.keys(serverSortFunctions),
    });
    result.sort((a, b) => {
      let value = 0;
      let nextKeyIndex = 0;
      let { column } = sortByColumnHistory[0];
      const { direction } = sortByColumnHistory[0];

      // hits each sort function until it finds a non-zero value
      while (value === 0 && nextKeyIndex < sortByColumnHistory.length) {
        const sortingInstructions = sortByColumnHistory[nextKeyIndex];
        column = sortingInstructions.column;

        const sortFunction = serverSortFunctions[column];
        value = sortFunction(a, b);
        nextKeyIndex++;
      }
      return direction === SortDirectionEnum.desc ? value : 0 - value;
    });
  } catch (err) {
    console.log("sorting fetched scores error:", { err });
  }

  console.log("sorted scores:", {
    first: scores[0],
    last: scores[scores.length - 1],
  });
  return result;
};
sortScores;

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
    scoreCountService.getByDeckSize(deckSizesFilter),
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
  const scoreCounts = resCounts.value as ScoreCount[];
  console.log("fresh from query:", {
    first: allScores[0],
    last: allScores[allScores.length - 1],
  });

  let allScoresWithPercentiles: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {};

  // run the calculations for each deck size
  for (let i = 0; i < scoreCounts.length; i++) {
    const thisCounts = scoreCounts[i];
    totals[thisCounts.deckSize] = thisCounts.totalScores;

    const scores = allScores.filter(
      ({ deckSize }) => deckSize === thisCounts.deckSize,
    );
    const scoresWithPercentiles = calculatePercentilesForScores(
      scores,
      thisCounts,
    );

    allScoresWithPercentiles = allScoresWithPercentiles.concat(
      scoresWithPercentiles,
    );
  }

  return {
    scores: allScoresWithPercentiles,
    // scores: sortScores(allScoresWithPercentiles, sortByColumnHistory),
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

  scoreCounts: {
    clear: server$(scoreCountService.clear),
    query: server$(scoreCountService.query),
    getDeckSizes: server$(scoreCountService.getDeckSizes),
    create: server$(scoreCountService.create),
    getByDeckSize: server$(scoreCountService.getByDeckSize),
    updateById: server$(scoreCountService.updateById),
    addScoreToCountsById: server$(scoreCountService.addScoreToCountById),
    updateByDeckSize: server$(scoreCountService.updateByDeckSize),
    getAll: server$(scoreCountService.getAll),
    saveScore: server$(scoreCountService.saveScoreToCount),
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
