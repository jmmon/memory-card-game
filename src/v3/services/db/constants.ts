import GAME from "~/v3/constants/game";
import {
  ScoreTableColumnEnum,
  type SortColumnWithDirection,
} from "../../types/types";
import { SORT_COLUMN_MAP } from "~/v3/components/scores-modal/constants";

export const SCORES_QUERY_PROPS_DEFAULT = {
  pageNumber: 1,
  resultsPerPage: 10,
  maxDeckSizes: 24,
  deckSizesFilter: [GAME.DECK_SIZE_DEFAULT],
  sortByColumnHistory: [
    SORT_COLUMN_MAP[ScoreTableColumnEnum.game_time_ds],
  ] as Array<SortColumnWithDirection>,
};
