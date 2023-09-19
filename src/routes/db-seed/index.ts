import { RequestHandler } from "@builder.io/qwik-city";
import runSeed from "~/v3/services/seed";

export const onGet: RequestHandler = async ({ query, json }) => {
  await runSeed({ totalDeckSizes: 24, scoresPerDeckSize: 2 });
  // console.log(requestEvent.url.searchParams);

  // const obj: Record<string, string> = {};
  // query.forEach((k, v) => obj[k] = v);

  json(200, {
    status: 200,
    body: {
      finished: true,
      // searchParams: obj,
    },
  });
};
