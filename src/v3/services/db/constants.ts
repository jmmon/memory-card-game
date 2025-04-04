import GAME from "~/v3/constants/game";
import {
  ScoreTableColumnEnum,
  SortDirectionEnum,
  type SortColumnWithDirection,
} from "../../types/types";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [GAME.DEFAULT_CARD_COUNT],
  sortByColumnHistory: [
    {
      column: ScoreTableColumnEnum.deck_size,
      direction: SortDirectionEnum.desc,
    },
  ] as Array<SortColumnWithDirection>,
  sortDirection: SortDirectionEnum.asc,
};
