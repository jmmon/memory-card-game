import {
  inArray,
} from "drizzle-orm";
import { DEFAULT_QUERY_PROPS } from "./constants";
import type { ScoreQueryProps } from "./types";
import { scores } from "~/v3/db/schemas";
import type { InsertScore } from "~/v3/db/schemas/types";
import { getDB } from "~/v3/db";
import { buildOrderBy } from "./utils";


const getAllScores = () => getDB().select().from(scores);

const queryScores = async ({
  pageNumber,
  resultsPerPage,
  deckSizesFilter,
  sortByColumnHistory,
}: Partial<ScoreQueryProps>) => {
  pageNumber = pageNumber ?? DEFAULT_QUERY_PROPS.pageNumber;
  resultsPerPage = resultsPerPage ?? DEFAULT_QUERY_PROPS.resultsPerPage;
  deckSizesFilter = deckSizesFilter ?? DEFAULT_QUERY_PROPS.deckSizesFilter;
  sortByColumnHistory =
    sortByColumnHistory ?? DEFAULT_QUERY_PROPS.sortByColumnHistory;

  const sqlOrderByList = buildOrderBy(sortByColumnHistory, scores);
  // console.log({
  //   pageNumber,
  //   resultsPerPage,
  //   deckSizesFilter,
  //   sortByColumnHistory,
  //   sqlOrderBy,
  // });

  const sqlQuery = getAllScores()
    // grab scores with deckSize in our array of deckSizes
    .where(inArray(scores.deckSize, deckSizesFilter))
    // sort using multiple sort column priorities
    .orderBy(...sqlOrderByList)
    .offset((pageNumber - 1) * resultsPerPage)
    .limit(resultsPerPage);

  console.log("sqlQuery:", { toSql: sqlQuery.toSQL() });

  return sqlQuery;
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
// const queryScoresWithPointer = async (
//   db: DrizzleDb,
//   {
//     pointerId = -1,
//     resultsPerPage,
//     deckSizesFilter,
//     sortByColumnHistory,
//   }: Partial<{
//     pointerId: number;
//     resultsPerPage: number;
//     deckSizesFilter: number[];
//     sortByColumnHistory: SortColumnWithDirection[];
//   }>,
// ) => {
//   resultsPerPage = resultsPerPage ?? DEFAULT_QUERY_PROPS.resultsPerPage;
//   deckSizesFilter = deckSizesFilter ?? DEFAULT_QUERY_PROPS.deckSizesFilter;
//   sortByColumnHistory =
//     sortByColumnHistory ?? DEFAULT_QUERY_PROPS.sortByColumnHistory;
//
//   const sqlOrderBy = buildOrderBySqlString(sortByColumnHistory);
//   console.log({
//     pointer: pointerId,
//     resultsPerPage,
//     deckSizesFilter,
//     sortByColumnHistory,
//     sqlOrderBy,
//   });
//
//   const queriedScores = await db
//     .select()
//     .from(scores)
//     // grab scores with deckSize in our array of deckSizes
//     .where(
//       and(inArray(scores.deckSize, deckSizesFilter), gte(scores.id, pointerId)),
//     )
//     // sort using multiple sort column priorities
//     .orderBy(sqlOrderBy)
//     .limit(resultsPerPage + 1);
//
//   return {
//     scores: queriedScores.slice(0, resultsPerPage),
//     nextPointer: queriedScores[resultsPerPage].id,
//   };
// };

// const getScoresByDeckSize = (deckSize: number) =>
//   getAllScores().where(eq(scores.deckSize, deckSize));

const createScore = async (newScore: InsertScore) => {
  if (!newScore.createdAt) newScore.createdAt = Date.now();
  const returnedScore = await getDB()
    .insert(scores)
    .values(newScore)
    .returning()
    .then((scores) => scores[0]);
  // console.log("createScore: after insert:", { returnedScore });
  return returnedScore;
};

// not really needed

// const getCountByDeckSize = (deckSize: number) =>
//   getDB()
//     .select({ count: count() })
//     .from(scores)
//     .where(eq(scores.deckSize, deckSize));

const clearScoresTable = () => getDB().delete(scores);

const scoreService = {
  create: createScore,
  getAll: getAllScores,
  query: queryScores,
  clear: clearScoresTable,
};
export default scoreService;
