import { server$ } from "@builder.io/qwik-city";
import type { InsertScore } from "~/v3/db/schemas/types";
import type { ScoreQueryProps } from "./types";
import { DEFAULT_QUERY_PROPS } from "./constants";
import scoreService from "./scores.service";
import scoreCountService from "./scoreCounts.service";
import { getDB } from "~/v3/db";
import logger from "../logger";
import { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import { calculatePercentilesWhileMaintainingOrder } from "./percentileUtils";

/*
 * These functions are wrapped with server$() before exported, so
 * they will always execute on the server, since they are db calls.
 * They can be called directly from the exported object from the client.
 * */


/**
 * query scores according to the params
 * query counts according to the decksizes listed
 * calculate percentile scores
 *
 * return scores and totals of each deck size
 * */
const queryScoresAndCalculatePercentiles = async ({
  pageNumber = DEFAULT_QUERY_PROPS.pageNumber,
  resultsPerPage = DEFAULT_QUERY_PROPS.resultsPerPage,
  deckSizesFilter = DEFAULT_QUERY_PROPS.deckSizesFilter,
  sortByColumnHistory = DEFAULT_QUERY_PROPS.sortByColumnHistory,
}: Partial<ScoreQueryProps>) => {
  logger(
    DebugTypeEnum.SERVICE,
    LogLevel.ONE,
    "queryScoresAndCalculatePercentiles",
  );
  // need the scores and the counts to calculate
  const [resScores, resCounts] = await Promise.allSettled([
    scoreService.query({
      pageNumber,
      resultsPerPage,
      deckSizesFilter,
      sortByColumnHistory,
    }),
    scoreCountService.getByDeckSize(deckSizesFilter),
  ]);

  // early return if error
  if (resScores.status !== "fulfilled" || resCounts.status !== "fulfilled") {
    console.log({ resScores, resCounts });
    const rejectedRes = [resScores, resCounts]
      .filter((res) => res.status === "rejected")
      .map((each) => JSON.stringify(each, null, 2));
    const message = "Error querying for " + rejectedRes.join(" and ");
    console.log({ message });
    return { scores: [], totals: {} };
  }

  const allScores = resScores.value;
  const scoreCounts = resCounts.value;
  console.log(
    "fresh from query:",
    allScores.map((score) => JSON.stringify(score)),
  );

  return calculatePercentilesWhileMaintainingOrder(allScores, scoreCounts);
};

const serverDbService = {
  scores: {
    getAll: server$(scoreService.getAll),
    queryWithPercentiles: server$(function (opts: Partial<ScoreQueryProps>) {
      // this.headers.set(
      //   "Cache-Control",
      //   "public, max-age=10, s-maxage=60",
      // );
      return queryScoresAndCalculatePercentiles(opts);
    }),
  },
  scoreCounts: {
    getDeckSizes: server$(scoreCountService.getDeckSizes),
    getAll: server$(scoreCountService.getAll),
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
