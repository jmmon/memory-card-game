import {
  ScoreTableColumnEnum,
  SortDirectionEnum,
  type SortColumnWithDirection,
} from "../types/types";
import CONSTANTS from "../utils/constants";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [CONSTANTS.CARD.COUNT],
  sortByColumnHistory: [
    {
      column: ScoreTableColumnEnum.deck_size,
      direction: SortDirectionEnum.desc,
    },
  ] as Array<SortColumnWithDirection>,
  sortDirection: SortDirectionEnum.asc,
};
