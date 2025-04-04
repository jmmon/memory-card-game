import { server$ } from "@builder.io/qwik-city";
import { drizzle } from "drizzle-orm/d1";
import scoreService from "./scores.service";
import type { ScoreQueryProps } from "./types";
import type { Score } from "~/v3/db/schemas/types";

const serverDbService = {
  scores: {
    clear: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);

      // const db = await useDb();
      return scoreService.clear(db);
    }),
    query: server$(async function (data: Partial<ScoreQueryProps>) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.query(db, data);
    }),
    getByDeckSize: server$(async function (deckSize: number) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.getByDeckSize(db, deckSize);
    }),
    create: server$(async function (score: Score) {
      const db = drizzle((this.platform.env as Env).DB);
      return scoreService.create(db, score);
    }),
    getAll: server$(async function () {
      const db = drizzle((this.platform.env as Env).DB);
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
