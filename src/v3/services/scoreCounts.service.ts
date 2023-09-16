import { eq, inArray, sql } from "drizzle-orm";
import { db, scoreCounts } from "../db";
import type { LessThanOurScoreObj } from "../types/types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import type { CountsQueryProps } from "./types";
import type { NewScoreCounts, Score, ScoreCounts } from "../db/types";
import { timestampToMs } from "../utils/formatTime";

const queryScoreCounts = ({
  pageNumber = DEFAULT_QUERY_PROPS.pageNumber,
  resultsPerPage = DEFAULT_QUERY_PROPS.maxDeckSizes,
  deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
  sortDirection = DEFAULT_QUERY_PROPS.sortDirection,
}: Partial<CountsQueryProps>) =>
  db
    .select()
    .from(scoreCounts)
    .where(inArray(scoreCounts.deckSize, deckSizesFilter))
    .orderBy(sql`${"deckSize"} ${sortDirection}`)
    .limit(resultsPerPage)
    .offset((pageNumber - 1) * resultsPerPage);

/*
 * for showing the list of deckSizes to filter by
 * */
const getDeckSizeList = () =>
  db
    .select({ deckSize: scoreCounts.deckSize })
    .from(scoreCounts)
    .orderBy(sql`"deckSize" asc`) // sort by deckSize
    .execute()
    .then((set) => set.map((each) => each?.deckSize)) // map to number[]
    .then((deckSizes) => deckSizes.filter((each) => each !== null) as number[]); // filter null

const createScoreCounts = (score: Score) =>
  /* @ts-ignore */
  db
    .insert(scoreCounts)
    .values({
      deckSize: score.deckSize,
      lessThanOurMismatchesMap: {
        [score.mismatches as number]: 0,
      },
      lessThanOurGameTimeMap: {
        [score.gameTime as string]: 0,
      },
      // WARNING: this is causing TS error! scores relation does not exist on scoreCounts
      scores: [score],
      totalScores: 1,
    })
    .returning();

const getScoreCountsByDeckSize = (deckSize: number) =>
  db.select().from(scoreCounts).where(eq(scoreCounts.deckSize, deckSize));

const updateScoreCountsById = (id: number, update: NewScoreCounts) =>
  db.update(scoreCounts).set(update).where(eq(scoreCounts.id, id)).returning();

const updateScoreCountsByDeckSize = (
  deckSize: number,
  update: NewScoreCounts
) =>
  db
    .update(scoreCounts)
    .set(update)
    .where(eq(scoreCounts.deckSize, deckSize))
    .returning();

const updateLessThanOurMismatchesJson = (
  ourScore: number,
  oldJson: LessThanOurScoreObj
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const entries = Object.entries(oldJson);
  for (let i = 0; i < entries.length; i++) {
    const [mismatchCount, lessThanCount] = entries[i];
    // DON'T MODIFY if LESS or EQUAL to ours
    if (Number(mismatchCount) <= ourScore) {
      newLessThanOurScoreJson[mismatchCount] = lessThanCount as number;
    } else {
      newLessThanOurScoreJson[mismatchCount] = (lessThanCount as number) + 1;
    }
  }
  return newLessThanOurScoreJson;
};

const updateLessThanOurGameTimeJson = (
  ourGameTime: string,
  oldJson: LessThanOurScoreObj
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  const entries = Object.entries(oldJson);
  for (let i = 0; i < entries.length; i++) {
    const [gameTime, lessThanCount] = entries[i];
    // DON'T MODIFY if LESS or EQUAL to ours
    if (timestampToMs(gameTime) <= timestampToMs(ourGameTime)) {
      newLessThanOurScoreJson[gameTime] = lessThanCount as number;
    } else {
      newLessThanOurScoreJson[gameTime] = (lessThanCount as number) + 1;
    }
  }
  return newLessThanOurScoreJson;
};

const addScoreToExistingCountsByCountsId = (
  foundOneScoreCounts: ScoreCounts,
  score: Score
) =>
  updateScoreCountsById(foundOneScoreCounts.id, {
    deckSize: foundOneScoreCounts.deckSize,
    lessThanOurMismatchesMap: updateLessThanOurMismatchesJson(
      score.mismatches as number,
      foundOneScoreCounts.lessThanOurMismatchesMap as LessThanOurScoreObj
    ),
    lessThanOurGameTimeMap: updateLessThanOurGameTimeJson(
      score.gameTime as string,
      foundOneScoreCounts.lessThanOurGameTimeMap as LessThanOurScoreObj
    ),
    /* @ts-ignore */ // WARNING: scores doesn't exist on type scoreCounts
    scores: [...foundOneScoreCounts.scores, score],
    totalScores: foundOneScoreCounts.scores.length + 1,
  });

// in the end, we will end up with 52 - 6 = 46 / 2 + 1 = 24 different deckSizes
const saveScoreToCounts = async (score: Score) => {
  let foundOneScoreCounts = (
    await getScoreCountsByDeckSize(score.deckSize as number)
  )[0] as ScoreCounts;

  console.log({ foundOneScoreCounts }); // What does the JSON field look like??

  if (!foundOneScoreCounts) {
    // creating a new scoreCounts
    return createScoreCounts(score);
  } else {
    // update lessThanOurScoreJson: for all keys greater than our score, increment the values by 1
    return addScoreToExistingCountsByCountsId(foundOneScoreCounts, score);
  }
};

const scoreCountsService = {
  query: queryScoreCounts,
  getDeckSizes: getDeckSizeList,
  create: createScoreCounts,
  getByDeckSize: getScoreCountsByDeckSize,
  updateById: updateScoreCountsById,
  addScoreToCountsById: addScoreToExistingCountsByCountsId,
  updateByDeckSize: updateScoreCountsByDeckSize,
  // /*
  //  * the main way to add a score: also updates the scoreCounts
  //  *  - creates Score
  //  *  - creates or updates ScoreCounts
  //  * */
  saveScore: saveScoreToCounts,
};
export default scoreCountsService;
