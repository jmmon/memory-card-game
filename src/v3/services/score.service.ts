import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { scores } from "../db";
import type { SortColumnWithDirection } from "../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import type { DrizzleDb, ScoreQueryProps } from "./types";
import type { NewScore } from "../db/types";
// import { JAN_1_1970_STRING } from "../components/scores-modal/scores-modal";

// const sortFns = {
//   gameTime: (a: Score, b: Score) => {
//     const value =
//       new Date(b.createdAt ?? JAN_1_1970_STRING).getTime() -
//       new Date(a.createdAt ?? JAN_1_1970_STRING).getTime();
//     return value;
//   },
//   mismatches: (a: Score, b: Score) => {
//     const value = (b.mismatches ?? 0) - (a.mismatches ?? 0);
//     return value;
//   },
// }

// getCategory(deckSize): returns list of scores matching deck size
const getAllScores = (db: DrizzleDb) => db.select().from(scores);

const buildOrderBySqlString = (
  sortByColumnHistory: Array<SortColumnWithDirection>,
) => {
  return sortByColumnHistory
    .map(({ column, direction }) => `"${column}" ${direction}`)
    .join(" ");
};

const clearScoresTable = (db: DrizzleDb) => db.delete(scores);

// const logging = (fn: () => any) => {
//   const result = fn()
//   console.log({logging: result});
//   return result
// }

const queryScores = async (
  db: DrizzleDb,
  {
    pageNumber,
    resultsPerPage,
    deckSizesFilter,
    sortByColumnHistory,
  }: Partial<ScoreQueryProps>,
) => {
  pageNumber = pageNumber ?? DEFAULT_QUERY_PROPS.pageNumber;
  resultsPerPage = resultsPerPage ?? DEFAULT_QUERY_PROPS.resultsPerPage;
  deckSizesFilter = deckSizesFilter ?? DEFAULT_QUERY_PROPS.deckSizesFilter;
  sortByColumnHistory =
    sortByColumnHistory ?? DEFAULT_QUERY_PROPS.sortByColumnHistory;

  const sqlOrderBy = sql`${buildOrderBySqlString(sortByColumnHistory)}`;
  console.log({
    pageNumber,
    resultsPerPage,
    deckSizesFilter,
    sortByColumnHistory,
    sqlOrderBy,
  });
  //
  // const test = await db.query.scores.findMany({
  //   where: inArray(scores.deckSize, deckSizesFilter),
  //   orderBy: sqlOrderBy,
  //   // offset: (pageNumber - 1) * resultsPerPage,
  //   // limit: resultsPerPage,
  // });
  // // console.log('query:', {test});
  // // const sortBy
  // return test.slice(
  //   (pageNumber - 1) * resultsPerPage,
  //   pageNumber * resultsPerPage,
  // );

  return (
    db
      .select()
      .from(scores)
      // grab scores with deckSize in our array of deckSizes
      .where(inArray(scores.deckSize, deckSizesFilter))
      // sort using multiple sort column priorities
      // .orderBy(sqlOrderBy)
      .offset((pageNumber - 1) * resultsPerPage)
      .limit(resultsPerPage)
  );
};

/*  TODO: figure out how to filter results properly
 *  idea: fetch scoreCounts, then use these numbers to sort the scores query
 *  (when we are sorting by time/mismatches percentiles
 *
 *  e.g. query the first 10 best mismatches from deckSize: 18
 *  - get the scoreCounts for deckSize: 18
 *  - sort by lessThan obj values, according to our query sorting params
 *  - ** use only one sorting param to make it simpler?? **
 *  - then we know the mismatces of the scores we want to get
 *  - so then query scores for these mismatches,
 *  - then sort by something else? in case we get >10 scores
 *  e.g. query the SECOND 10 best mismatches from deckSize: 18
 *  - we will use an id cursor that will be the next in the list from the last query
 *  - i.e. if last query ended  with 12 results, and it sent 10 (+ 1 for the pointer),
 *      we use that pointer.id as where our next "page" will start
 * */
const queryScoresWithPointer = async (
  db: DrizzleDb,
  {
    pointerId = -1,
    resultsPerPage,
    deckSizesFilter,
    sortByColumnHistory,
  }: Partial<{
    pointerId: number;
    resultsPerPage: number;
    deckSizesFilter: number[];
    sortByColumnHistory: SortColumnWithDirection[];
  }>,
) => {
  resultsPerPage = resultsPerPage ?? DEFAULT_QUERY_PROPS.resultsPerPage;
  deckSizesFilter = deckSizesFilter ?? DEFAULT_QUERY_PROPS.deckSizesFilter;
  sortByColumnHistory =
    sortByColumnHistory ?? DEFAULT_QUERY_PROPS.sortByColumnHistory;

  const sqlOrderBy = sql`${buildOrderBySqlString(sortByColumnHistory)}`;
  console.log({
    pointer: pointerId,
    resultsPerPage,
    deckSizesFilter,
    sortByColumnHistory,
    sqlOrderBy,
  });

  const queriedScores = await db
    .select()
    .from(scores)
    // grab scores with deckSize in our array of deckSizes
    .where(
      and(inArray(scores.deckSize, deckSizesFilter), gte(scores.id, pointerId)),
    )
    // sort using multiple sort column priorities
    .orderBy(sqlOrderBy)
    .limit(resultsPerPage + 1);

  return {
    scores: queriedScores.slice(0, resultsPerPage),
    nextPointer: queriedScores[resultsPerPage].id,
  };
};

const getScoresByDeckSize = (db: DrizzleDb, deckSize: number) =>
  getAllScores(db).where(eq(scores.deckSize, deckSize));

const createScore = async (db: DrizzleDb, newScore: NewScore) => {
  if (!newScore.createdAt) newScore.createdAt = new Date().toISOString();
  return (await db.insert(scores).values(newScore).returning())[0];
};

const scoreService = {
  clear: clearScoresTable,
  query: queryScores,
  queryWithPointer: queryScoresWithPointer,
  getByDeckSize: getScoresByDeckSize,
  create: createScore,
  getAll: getAllScores,
  // queryWithPercentiles: server$(queryScoresAndCalculatePercentiles),
};
export default scoreService;
