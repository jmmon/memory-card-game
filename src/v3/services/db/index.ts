import { server$ } from "@builder.io/qwik-city";
import { drizzle } from "drizzle-orm/d1";
import scoreService from "./scores.service";
import type { ScoreQueryProps } from "./types";
import type { Score } from "~/v3/db/schemas/types";
import type { Env } from "~/v3/types/types";

// const getDb = server$(function () {
//   return drizzle((this.platform.env as Env).DB);
// });
const serverDbService = {
  scores: {
    clear: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      // const db = await getDb();
      return scoreService.clear(db);
    }),
    query: server$(async function (data: Partial<ScoreQueryProps>) {
      const db = drizzle((this.platform.env as Env).DB);
      // const db = await getDb();
      return scoreService.query(db, data);
    }),
    getByDeckSize: server$(async function (deckSize: number) {
      const db = drizzle((this.platform.env as Env).DB);
      // const db = await getDb();
      return scoreService.getByDeckSize(db, deckSize);
    }),
    create: server$(async function (score: Score) {
      const db = drizzle((this.platform.env as Env).DB);
      // const db = await getDb();
      return scoreService.create(db, score);
    }),
    getAll: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
      // const db = await getDb();
      return scoreService.getAll(db);
    }),
    // queryWithPercentiles: server$(async function (
    //   data: Partial<ScoreQueryProps>,
    // ) {
    //   const db = drizzle((this.platform.env as Env).DB);
    //   return queryScoresAndCalculatePercentiles(db, data);
    // }),
  },
};

export default serverDbService;
