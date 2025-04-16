import GAME from "~/v3/constants/game";
import {
  ScoreTableColumnEnum,
  SortDirectionEnum,
  type SortColumnWithDirection,
} from "../../types/types";
import { DEFAULT_SORT_BY_COLUMNS_MAP } from "~/v3/components/scores-modal/constants";

export const DEFAULT_QUERY_PROPS = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [GAME.DECK_SIZE_DEFAULT],
  sortByColumnHistory: [
    DEFAULT_SORT_BY_COLUMNS_MAP[ScoreTableColumnEnum.game_time_ds],
  ] as Array<SortColumnWithDirection>,
  sortDirection: SortDirectionEnum.asc,
};
