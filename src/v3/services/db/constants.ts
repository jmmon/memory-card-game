import GAME from "~/v3/constants/game";
import {
  ScoreTableColumnEnum,
  type SortColumnWithDirection,
} from "../../types/types";
import { COLUMNS_MAP_SORT_BY_DEFAULT } from "~/v3/components/scores-modal/constants";

export const SCORES_QUERY_PROPS_DEFAULT = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [GAME.DECK_SIZE_DEFAULT],
  sortByColumnHistory: [
    COLUMNS_MAP_SORT_BY_DEFAULT[ScoreTableColumnEnum.game_time_ds],
  ] as Array<SortColumnWithDirection>,
};
