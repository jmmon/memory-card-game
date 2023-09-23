import type { SortColumnWithDirection, SortDirection } from "../types/types";
import CONSTANTS from "../utils/constants";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [CONSTANTS.CARD.COUNT],
  sortByColumnHistory: [
    { column: "deckSize", direction: "desc" },
  ] as Array<SortColumnWithDirection>,
  sortDirection: "asc" as SortDirection,
};
