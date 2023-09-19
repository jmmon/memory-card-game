import { DEFAULT_CARD_COUNT } from "../components/game/game";
import { SortColumnWithDirection, SortDirection } from "../types/types";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [DEFAULT_CARD_COUNT],
  sortByColumnHistory: [
    { column: "deckSize", direction: "desc" },
  ] as Array<SortColumnWithDirection>,
  sortDirection: "asc" as SortDirection,
};
