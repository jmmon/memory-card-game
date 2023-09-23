import { eq, inArray, sql } from "drizzle-orm";
import { db, scores } from "../db";
import type { SortColumnWithDirection } from "../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import type { ScoreQueryProps } from "./types";
import type { NewScore } from "../db/types";

// getCategory(deckSize): returns list of scores matching deck size
const getAllScores = () => db.select().from(scores);

const buildOrderBySqlString = (
  sortByColumnHistory: Array<SortColumnWithDirection>
) => {
  return sortByColumnHistory
    .map(({ column, direction }) =>
      direction === "asc" ? `"${column}" asc` : `"${column}" desc`
    )
    .join(" ");
};

const clearScoresTable = () => db.delete(scores);

// const logging = (fn: () => any) => {
//   const result = fn()
//   console.log({logging: result});
//   return result
// }

const queryScores = ({
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

  return (
    db
      .select()
      .from(scores)
      // grab scores with deckSize in our array of deckSizes
      .where(inArray(scores.deckSize, deckSizesFilter))
      // sort using multiple sort column priorities
      .orderBy(sql`${buildOrderBySqlString(sortByColumnHistory)}`)
      .limit(resultsPerPage)
      .offset((pageNumber - 1) * resultsPerPage)
  );
};

const getScoresByDeckSize = (deckSize: number) =>
  getAllScores().where(eq(scores.deckSize, deckSize));

const createScore = async (newScore: NewScore) => {
  if (!newScore.createdAt) newScore.createdAt = new Date();
  return (await db.insert(scores).values(newScore).returning())[0];
};

const scoreService = {
  clear: clearScoresTable,
  query: queryScores,
  getByDeckSize: getScoresByDeckSize,
  create: createScore,
  getAll: getAllScores,
  // queryWithPercentiles: server$(queryScoresAndCalculatePercentiles),
};
export default scoreService;
