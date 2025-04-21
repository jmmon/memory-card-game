import type {
  ScoreTableColumn,
  SortColumnWithDirection,
} from "~/v3/types/types";
import { ScoreTableColumnEnum, SortDirectionEnum } from "~/v3/types/types";

export const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z" as const;

// export enum HeaderListEnum {
//   Avatar = "Avatar",
//   Initials = "Initials",
//   "Deck Size" = "Deck Size",
//   Pairs = "Pairs",
//   "Game Time" = "Game Time",
//   Mismatches = "Mismatches",
//   Date = "Date",
// }
// export type HeaderListType = keyof typeof HeaderListEnum;
export const HEADER_LIST = [
  "Avatar",
  "Initials",
  "Deck Size",
  "Pairs",
  "Game Time",
  "Mismatches",
  "Date",
] as const;

export const HEADER_UNSORTABLE = ["Avatar"];

export const MAP_COL_TITLE_TO_OBJ_KEY: { [key: string]: ScoreTableColumn } = {
  initials: "initials",
  "deck-size": "deck_size",
  pairs: "pairs",
  mismatches: "mismatches",
  "game-time": "game_time_ds",
  date: "created_at",
} as const;

export const COLUMNS_MAP_SORT_BY_DEFAULT: {
  [key in ScoreTableColumnEnum]: SortColumnWithDirection;
} = {
  [ScoreTableColumnEnum.initials]: {
    column: ScoreTableColumnEnum.initials,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.deck_size]: {
    column: ScoreTableColumnEnum.deck_size,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.pairs]: {
    column: ScoreTableColumnEnum.pairs,
    direction: SortDirectionEnum.desc,
  },
  [ScoreTableColumnEnum.mismatches]: {
    column: ScoreTableColumnEnum.mismatches,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.game_time_ds]: {
    column: ScoreTableColumnEnum.game_time_ds,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.created_at]: {
    column: ScoreTableColumnEnum.created_at,
    direction: SortDirectionEnum.desc,
  },
} as const;

export const DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY = Object.values(
  COLUMNS_MAP_SORT_BY_DEFAULT,
);

export const MAX_SORT_COLUMN_HISTORY = 3 as const;
