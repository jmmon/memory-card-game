import type { RequestHandler } from "@builder.io/qwik-city";
import runSeed from "~/v3/services/seed";

export const onGet: RequestHandler = async (requestEvent) => {
  const obj: Record<string, string> = {};

  // console.log(requestEvent.url.toString());
  requestEvent.query.forEach((v, k) => {
    // console.log({k,v});
    obj[k] = v;
  });

  const opts = {
    totalDeckSizes: Number(obj.totalDeckSize ?? 10),
    scoresPerDeckSize: Number(obj.scoresPerDeckSize ?? 10)
  }

  const start = Date.now();
  // console.log({opts});

  await runSeed(opts);

  requestEvent.json(200, {
    status: 200,
    body: {
      time: ((Date.now() - start) / 1000) + 'ms',
      finished: true,
      searchParams: obj,
      opts,
    },
  });
};
