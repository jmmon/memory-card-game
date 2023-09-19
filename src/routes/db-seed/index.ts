import { RequestHandler } from "@builder.io/qwik-city";
import runSeed from "~/v3/services/seed";

export const onGet: RequestHandler = async (requestEvent) => {
  await runSeed({ totalDeckSizes: 5, scoresPerDeckSize: 10 });

  requestEvent.json(200, {
    status: 200,
    body: {
      finished: true,
    },
  });
};
