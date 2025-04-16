import { eq, inArray } from "drizzle-orm";
import { getDB, scoreCounts } from "../../db";
import {
  ScoreTableColumnEnum,
} from "../../types/types";
// import { DEFAULT_QUERY_PROPS } from "./constants";
// import type { CountsQueryProps } from "./types";
import type {
  InsertScoreCount,
  Score,
  ScoreCount,
} from "~/v3/db/schemas/types";
import { DEFAULT_SORT_BY_COLUMNS_MAP } from "~/v3/components/scores-modal/constants";
import { buildOrderBy } from "./utils";
import { updateWorseThanOurScoreMap } from "./percentileUtils";

const getAllScoreCounts = () => getDB().select().from(scoreCounts);

// const queryScoreCounts = ({
//   deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
//   sortDirection = DEFAULT_QUERY_PROPS.sortDirection,
// }: Partial<CountsQueryProps>) =>
//   getAllScoreCounts()
//     .where(inArray(scoreCounts.deckSize, deckSizesFilter))
//     .orderBy(
//       ...buildOrderBy(
//         [
//           {
//             column: ScoreTableColumnEnum.deck_size,
//             direction: sortDirection,
//           },
//         ],
//         scoreCounts,
//       ),
//     );

const clearScoreCountsTable = () => getDB().delete(scoreCounts);

/*
 * for showing the list of deckSizes to filter by
 * */
const getDeckSizeList = () =>
  getDB()
    .select({ deckSize: scoreCounts.deckSize })
    .from(scoreCounts)
    .orderBy(
      ...buildOrderBy(
        [DEFAULT_SORT_BY_COLUMNS_MAP[ScoreTableColumnEnum.deck_size]],
        scoreCounts,
      ),
    ) // sort by deckSize
    .execute()
    .then((counts) => counts.map(({ deckSize }) => deckSize));

const createScoreCount = async ({ deckSize, mismatches, gameTimeDs }: Score) =>
  getDB()
    .insert(scoreCounts)
    .values({
      createdAt: Date.now(),
      deckSize: deckSize,
      worseThanOurMismatchesMap: `{${mismatches}: 0}`, // 0 other scores worse than ours, since we're the only score
      worseThanOurGameTimeMap: `{${gameTimeDs}: 0}`, // 0 other scores worse than ours, since we're the only score
      totalScores: 1,
    })
    .returning()
    .then((newCounts) => newCounts[0]);

const getManyScoreCountsByDeckSize = async (deckSizes: number[]) =>
  getAllScoreCounts().where(inArray(scoreCounts.deckSize, deckSizes));

const getOneScoreCountByDeckSize = async (deckSize: number) =>
  getAllScoreCounts()
    .where(eq(scoreCounts.deckSize, deckSize))
    .then((count) => count[0]);

// const updateScoreCountById = async (id: number, update: InsertScoreCount) =>
//   getDB()
//     .update(scoreCounts)
//     .set(update)
//     .where(eq(scoreCounts.id, id))
//     .returning()
//     .then((counts) => counts[0]);

const updateScoreCountByDeckSize = async (update: InsertScoreCount) =>
  getDB()
    .update(scoreCounts)
    .set(update)
    .where(eq(scoreCounts.deckSize, update.deckSize))
    .returning()
    .then((counts) => counts[0]);


/*
 * */

const addScoreToExistingCount = (
  {
    deckSize,
    totalScores,
    worseThanOurMismatchesMap,
    worseThanOurGameTimeMap,
  }: ScoreCount,
  score: Score,
) =>
  updateScoreCountByDeckSize({
    deckSize: deckSize,
    worseThanOurMismatchesMap: updateWorseThanOurScoreMap(
      score,
      totalScores,
      worseThanOurMismatchesMap,
      "mismatches",
    ),
    worseThanOurGameTimeMap: updateWorseThanOurScoreMap(
      score,
      totalScores,
      worseThanOurGameTimeMap,
      "gameTimeDs",
    ),
    totalScores: totalScores + 1,
    createdAt: Date.now(),
  });

// in the end, we will end up with 52 - 6 = 46 / 2 + 1 = 24 different deckSizes
const saveScoreToCount = async (score: Score) => {
  const foundOneScoreCount = await getOneScoreCountByDeckSize(score.deckSize);
  return foundOneScoreCount
    ? addScoreToExistingCount(foundOneScoreCount, score)
    : createScoreCount(score);
};

const scoreCountService = {
  getAll: getAllScoreCounts,
  getDeckSizes: getDeckSizeList,
  getByDeckSize: getManyScoreCountsByDeckSize,
  clear: clearScoreCountsTable,
  /*
   * the main way to add a score: also updates the scoreCounts
   *  - creates Score
   *  - creates or updates ScoreCounts
   * */
  saveScoreToCount,
};
export default scoreCountService;
