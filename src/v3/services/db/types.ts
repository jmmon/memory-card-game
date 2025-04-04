import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SortColumnWithDirection, SortDirection } from "../../types/types";
import type { D1Database } from "@cloudflare/workers-types";

export type ScoreQueryProps = {
  pageNumber: number;
  resultsPerPage: number;
  deckSizesFilter: number[];
  sortByColumnHistory: Array<SortColumnWithDirection>;
};
export type CountsQueryProps = {
  deckSizesFilter: number[];
  sortDirection: SortDirection;
};

export type DrizzleDb = DrizzleD1Database<Record<string, never>> & {
  $client: D1Database;
};
