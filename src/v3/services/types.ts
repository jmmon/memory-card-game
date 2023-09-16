import type { SortColumnWithDirection, SortDirection } from "../types/types";

export type ScoreQueryProps = {
  pageNumber: number;
  resultsPerPage: number;
  deckSizesFilter: number[];
  sortByColumnHistory: Array<SortColumnWithDirection>;
};
export type CountsQueryProps = {
  pageNumber: number;
  resultsPerPage: number;
  deckSizesFilter: number[];
  sortDirection: SortDirection;
};
