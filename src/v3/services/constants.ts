import { SortColumnWithDirection, SortDirection } from "../types/types";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [18],
  sortByColumnHistory: [
    { column: "deckSize", direction: "desc" },
  ] as Array<SortColumnWithDirection>,
  sortDirection: "asc" as SortDirection,
};
