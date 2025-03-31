import type { RequestHandler } from "@builder.io/qwik-city";
import runSeed from "~/v3/services/seed";

const DEFAULT_SCORES_PER_DECK_SIZE = 5_000;
const DEFAULT_TOTAL_DECK_SIZES = 24;

export const onGet: RequestHandler = async (requestEvent) => {
  if (process.env.FEATURE_FLAG_SCORES_DISABLED === "true") {
    requestEvent.json(300, {
      body: {
        message: "Scores disabled",
      },
    });
    return;
  }

  // create an obj from the query params
  const obj = Object.fromEntries(requestEvent.query.entries());

  const totalDeckSizes = Math.max(
    1,
    Math.min(
      Number(obj.totalDeckSizes ?? DEFAULT_TOTAL_DECK_SIZES),
      DEFAULT_TOTAL_DECK_SIZES,
    ),
  );
  const scoresPerDeckSize = Math.max(
    1,
    Number(obj.scoresPerDeckSize ?? DEFAULT_SCORES_PER_DECK_SIZE),
  );

  const opts = {
    totalDeckSizes,
    scoresPerDeckSize,
  };

  const start = Date.now();
  // console.log({opts});

  try {
    await runSeed(opts);

    const end = Date.now();
    const differenceSeconds = (end - start) / 1000;

    console.log(`Finished: ${differenceSeconds} seconds`, {
      totalDeckSizes,
      scoresPerDeckSize,
    });

    requestEvent.json(200, {
      status: 200,
      body: {
        time: differenceSeconds + " seconds",
        finished: true,
        searchParams: obj,
        opts,
      },
    });
  } catch (err) {
    const end = Date.now();
    const differenceSeconds = (end - start) / 1000;
    console.log(`FAILED: ${differenceSeconds} seconds`, {
      totalDeckSizes,
      scoresPerDeckSize,
    });
    requestEvent.json(200, {
      status: 200,
      body: {
        time: differenceSeconds + " seconds",
        finished: false,
        searchParams: obj,
        opts,
        err,
      },
    });
  }
};
