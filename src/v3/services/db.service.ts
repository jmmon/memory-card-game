import type { NewScore, NewScoreCounts, Score, ScoreCounts } from "../db/types";
import { server$ } from "@builder.io/qwik-city";
import {
  SortDirectionEnum,
  type Env,
  type LessThanOurScoreObj,
  type ScoreWithPercentiles,
  type SortColumnWithDirection,
} from "../types/types";
import type { CountsQueryProps, DrizzleDb, ScoreQueryProps } from "./types";
import { DEFAULT_QUERY_PROPS } from "./constants";

import scoreService from "./score.service";
import scoreCountsService from "./scoreCounts.service";
import { roundToDecimals } from "../components/game-header/game-header";
import { drizzle } from "drizzle-orm/d1";

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
  counts: ScoreCounts,
) => {
  const entriesLtGameTimeObjSortedDesc = Object.entries(
    JSON.parse(counts.worseThanOurGameTimeMap) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), Number(v)] as [number, number])
    .sort(([timeA], [timeB]) => timeA - timeB);

  const ltGameTimeObjSortedDesc = Object.fromEntries(
    entriesLtGameTimeObjSortedDesc,
  ) as LessThanOurScoreObj;

  const entriesLtMismatchesObjSortedDesc = Object.entries(
    JSON.parse(counts.worseThanOurMismatchesMap) as LessThanOurScoreObj,
  )
    .map(([k, v]) => [Number(k), Number(v)] as [number, number])
    .sort(([mismatchesA], [mismatchesB]) => mismatchesA - mismatchesB);

  const ltMismatchesObjSortedDesc = Object.fromEntries(
    entriesLtMismatchesObjSortedDesc,
  ) as LessThanOurScoreObj;

  const total = counts.totalScores;

  // console.log({ ltGameTimeObjSortedDesc, ltMismatchesObjSortedDesc, total });

  return scores.map((score) =>
    generateScoreWithPercentiles(
      score,
      entriesLtGameTimeObjSortedDesc,
      entriesLtMismatchesObjSortedDesc,
      ltGameTimeObjSortedDesc,
      ltMismatchesObjSortedDesc,
      total,
    ),
  );
};

const clientSortFunctions: {
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
  game_time: (a: ScoreWithPercentiles, b: ScoreWithPercentiles) => {
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
    console.log("sorting fetched scores");
    result.sort((a, b) => {
      let value = 0;
      let nextKeyIndex = 0;
      let { column } = sortByColumnHistory[0];
      const { direction } = sortByColumnHistory[0];

      // go through each sortBy in the array
      while (value === 0 && nextKeyIndex < sortByColumnHistory.length) {
        const sortingInstructions = sortByColumnHistory[nextKeyIndex];
        column = sortingInstructions.column;

        const sortFunction = clientSortFunctions[column];
        value = sortFunction(a, b);
        nextKeyIndex++;
      }
      return direction === SortDirectionEnum.desc ? value : 0 - value;
    });
  } catch (err) {
    console.log("sorting fetched scores error:", { err });
  }

  return result;
};

const queryScoresAndCalculatePercentiles = async (
  db: DrizzleDb,
  {
    pageNumber = DEFAULT_QUERY_PROPS.pageNumber,
    resultsPerPage = DEFAULT_QUERY_PROPS.resultsPerPage,
    deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
    sortByColumnHistory = DEFAULT_QUERY_PROPS.sortByColumnHistory,
  }: Partial<ScoreQueryProps>,
) => {
  const [resScores, resCounts] = await Promise.allSettled([
    scoreService.query(db, {
      pageNumber,
      resultsPerPage,
      deckSizesFilter,
      sortByColumnHistory,
    }),
    scoreCountsService.getByDeckSize(db, deckSizesFilter),
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
  console.log("fresh from query:", { length: allScores.length });

  let allScoresWithPercentiles: ScoreWithPercentiles[] = [];
  const totals: { [key: number]: number } = {};

  // run the calculations for each deck size
  for (let i = 0; i < counts.length; i++) {
    const thisCounts = counts[i];
    const scores = allScores.filter(
      (score) => score.deckSize === thisCounts.deckSize,
    );
    const scoresWithPercentiles = calculatePercentilesForScores(
      scores,
      thisCounts,
    );

    allScoresWithPercentiles = allScoresWithPercentiles.concat(
      scoresWithPercentiles,
    );

    totals[thisCounts.deckSize] = thisCounts.totalScores;
  }

  return {
    scores: sortScores(allScoresWithPercentiles, sortByColumnHistory),
    totals,
  };
};

// export const useDb = server$(function () {
//   return drizzle((this.platform.env as Env).DB);
// });

const serverDbService = {
  scores: {
    clear: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);

      // const db = await useDb();
      return scoreService.clear(db);
    }),
    query: server$(async function (data: Partial<ScoreQueryProps>) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.query(db, data);
    }),
    getByDeckSize: server$(async function (deckSize: number) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.getByDeckSize(db, deckSize);
    }),
    create: server$(async function (score: NewScore) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.create(db, score);
    }),
    getAll: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.getAll(db);
    }),
    queryWithPercentiles: server$(async function (
      data: Partial<ScoreQueryProps>,
    ) {
      const db = drizzle((this.platform.env as Env).DB);
      return queryScoresAndCalculatePercentiles(db, data);
    }),
  },
  saveNewScore: server$(async function (score: NewScore) {
    const db = drizzle((this.platform.env as Env).DB);
    const newScore = await scoreService.create(db, score);
    const newScoreCounts = await scoreCountsService.saveScore(
      db,
      newScore as Score,
    );
    // console.log("saveNewScore:", { newScore, newScoreCounts });
    return { newScore, newScoreCounts };
  }),

  scoreCounts: {
    clear: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.clear(db);
    }),
    query: server$(async function (data: Partial<CountsQueryProps>) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.query(db, data);
    }),
    getDeckSizes: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.getDeckSizes(db);
    }),
    create: server$(async function (score: Score) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.create(db, score);
    }),
    getByDeckSize: server$(async function (deckSizes: number[]) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.getByDeckSize(db, deckSizes);
    }),
    updateById: server$(async function (id: number, update: NewScoreCounts) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.updateById(db, id, update);
    }),
    addScoreToCountsById: server$(async function (
      foundOneScoreCounts: ScoreCounts,
      score: Score,
    ) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.addScoreToCountsById(
        db,
        foundOneScoreCounts,
        score,
      );
    }),
    updateByDeckSize: server$(async function (
      deckSize: number,
      update: NewScoreCounts,
    ) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.updateByDeckSize(db, deckSize, update);
    }),
    getAll: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.getAll(db);
    }),
    // /*
    //  * the main way to add a score: also updates the scoreCounts
    //  *  - creates Score
    //  *  - creates or updates ScoreCounts
    //  * */
    saveScore: server$(async function (score: Score) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreCountsService.saveScore(db, score);
    }),
  },
  clearData: server$(async function () {
    const db = drizzle((this.platform.env as Env).DB);
    await scoreCountsService.clear(db);
    await scoreService.clear(db);
    // Promise.all([scoreCountsService.clear(), scoreService.clear()])
  }),
};

export default serverDbService;
