import { eq, inArray, asc, desc } from "drizzle-orm";
import { db } from "../db/index";
import { scores, scoreCounts } from "../db/index";
import {
  type NewScore,
  type NewScoreCounts,
  type ScoreCounts,
} from "../db/types";
import { server$ } from "@builder.io/qwik-city";
import {
  LessThanOurScoreObj,
  ScoreCountColumnOptions,
  SortColumnWithDirection,
} from "../types/types";
import { timestampToMs } from "../utils/formatTime";

// submitWin(data): submits the win and calculates and returns your percentile scores

// getCategory(deckSize): returns list of scores matching deck size
// getAllScores(): returns all scores
//
const getAllScores = () => db.select().from(scores);

const buildOrderBy = (sortByColumnHistory: Array<SortColumnWithDirection>) => {
  const strKeyScores = scores as typeof scores & { [key: string]: any };
  return sortByColumnHistory.map(({ column, direction }) =>
    direction === "asc" ? asc(strKeyScores[column]) : desc(strKeyScores[column])
  );
};

const queryScores = ({
  pageNumber,
  resultsPerPage = 10,
  deckSizesFilter,
  sortByColumnHistory,
}: {
  pageNumber: number;
  resultsPerPage?: number;
  deckSizesFilter: number[];
  sortByColumnHistory: Array<SortColumnWithDirection>;
}) =>
  db
    .select()
    .from(scores)
    // grab scores with deckSize in our array of deckSizes
    .where(inArray(scores.deckSize, deckSizesFilter))
    // sort using multiple sort column priorities
    .orderBy(...buildOrderBy(sortByColumnHistory))
    .limit(resultsPerPage)
    .offset((pageNumber - 1) * resultsPerPage);

const getScoresByDeckSize = (deckSize: number) =>
  getAllScores().where(eq(scores.deckSize, deckSize));

const createScore = (newScore: NewScore) => {
  if (!newScore.createdAt) newScore.createdAt = new Date();
  return db.insert(scores).values(newScore).returning();
};

const createScoreCounts = ({
  deckSize,
}: {
  deckSize: number;
}) =>
  db
    .insert(scoreCounts)
    .values({ deckSize, lessThanOurGameTimeMap: {}, lessThanOurMismatchesMap: {} })
    .returning();

const updateScoreCounts = (
  prevScoreCounts: ScoreCounts,
  update: NewScoreCounts
) =>
  db
    .update(scoreCounts)
    .set(update)
    .where(eq(scoreCounts.id, prevScoreCounts.id))
    .returning();

const updateLessThanOurMismatchesJson = (
  ourScore: number,
  oldJson: LessThanOurScoreObj
) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  Object.entries(oldJson).forEach(([scoreCount, lessThanCount]) => {
    // DON'T MODIFY if LESS or EQUAL to ours
    if (Number(scoreCount) <= ourScore) {
      newLessThanOurScoreJson[Number(scoreCount)] = lessThanCount as number;
    } else {
      newLessThanOurScoreJson[Number(scoreCount)] =
        (lessThanCount as number) + 1;
    }
  });
  return newLessThanOurScoreJson;
};

const updateLessThanOurGameTimeJson = (ourGameTime: string, oldJson: LessThanOurScoreObj) => {
  const newLessThanOurScoreJson: LessThanOurScoreObj = {};
  Object.entries(oldJson).forEach(([gameTime, lessThanCount]) => {
    // DON'T MODIFY if LESS or EQUAL to ours
    if (timestampToMs(gameTime) <= timestampToMs(ourGameTime)) {
      newLessThanOurScoreJson[gameTime] = lessThanCount as number;
    } else {
      newLessThanOurScoreJson[gameTime] =
        (lessThanCount as number) + 1;
    }
  });
  return newLessThanOurScoreJson;
}

// in the end, we will end up with 52 - 6 = 46 / 2 + 1 = 24 different deckSizes
// and we have two different columns for each deckSize
// so in total, up to 24 * 2 = 48 entries in this table
const addScoreToCounts = async (
  score: NewScore,
) => {
  const deckSize = score.deckSize as number;
  let foundOneScoreCounts = (
    (await db
      .select()
      .from(scoreCounts)
      .where(eq(scoreCounts.deckSize, deckSize))) as ScoreCounts[]
  )[0];

  console.log({ foundOneScoreCounts }); // What does the JSON field look like??

  if (!foundOneScoreCounts) {
    // creating a new scoreCounts
    const newScoreCounts = {
      deckSize,
      lessThanOurMismatchesMap: {
        [score.mismatches as number]: 0, // when creating, 0 other scores are LESS THAN our mismatch score
      },
      lessThanOurGameTimeMap: { // TODO: this will end up creating TONS of entries, one for every gameTime. I guess that's okay for now??
        [score.gameTime as string]: 0, // when creating, 0 other scores are LESS THAN our gameTime score
      },
      scores: [score],
    };
    return createScoreCounts(newScoreCounts);
  } else {
    // update lessThanOurScoreJson: for all keys greater than our score, increment the values by 1
    const newLessThanOurMismatches = updateLessThanOurMismatchesJson(
      score.mismatches as number,
      foundOneScoreCounts.lessThanOurMismatchesMap as LessThanOurScoreObj
    );
    const newLessThanOurGameTime = updateLessThanOurGameTimeJson(
      score.gameTime as string,
      foundOneScoreCounts.lessThanOurGameTimeMap as LessThanOurScoreObj
    );

    const update = {
      lessThanOurMismatchesMap: newLessThanOurMismatches,
      lessThanOurGameTimeMap: newLessThanOurGameTime,
      scores: [...foundOneScoreCounts.scores, score],
    };
    return updateScoreCounts(foundOneScoreCounts, update);
  }
};

const serverDbService = {
  getAllScores: server$(getAllScores),
  getScoresByDeckSize: server$(getScoresByDeckSize),
  createScore: server$(createScore),
  queryScores: server$(queryScores),
  addScoreToCounts: server$(addScoreToCounts),
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
 * */

export default serverDbService;
