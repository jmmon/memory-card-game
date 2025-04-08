import type {
  ScoreTableColumn,
  SortColumnWithDirection} from "~/v3/types/types";
import {
  ScoreTableColumnEnum,
  SortDirectionEnum,
} from "~/v3/types/types";

export const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z" as const;

export const PIXEL_AVATAR_SIZE = 44 as const;

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

export const MAP_COL_TITLE_TO_OBJ_KEY: { [key: string]: ScoreTableColumn } = {
  initials: "initials",
  "deck-size": "deck_size",
  pairs: "pairs",
  "game-time": "game_time_ds",
  mismatches: "mismatches",
  // "game-time": "timePercentile",
  // mismatches: "mismatchPercentile",
  date: "created_at",
} as const;

export const DEFAULT_SORT_BY_COLUMNS_MAP: {
  [key in ScoreTableColumnEnum]: SortColumnWithDirection;
} = {
  [ScoreTableColumnEnum.deck_size]: {
    column: ScoreTableColumnEnum.deck_size,
    direction: SortDirectionEnum.desc,
  },
  // [ScoreTableColumnnEnum.timePercentile]: {
  //   column: "timePercentile",
  //   direction: "desc",
  // },
  // [ScoreTableColumnnEnum.mismatchPercentile]: {
  //   column: "mismatchPercentile",
  //   direction: "desc",
  // },
  [ScoreTableColumnEnum.game_time_ds]: {
    column: ScoreTableColumnEnum.game_time_ds,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.mismatches]: {
    column: ScoreTableColumnEnum.mismatches,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.initials]: {
    column: ScoreTableColumnEnum.initials,
    direction: SortDirectionEnum.asc,
  },
  [ScoreTableColumnEnum.pairs]: {
    column: ScoreTableColumnEnum.pairs,
    direction: SortDirectionEnum.desc,
  },
  [ScoreTableColumnEnum.created_at]: {
    column: ScoreTableColumnEnum.created_at,
    direction: SortDirectionEnum.desc,
  },
} as const;

export const DEFAULT_SORT_BY_COLUMNS_WITH_DIRECTION_HISTORY = Object.values(
  DEFAULT_SORT_BY_COLUMNS_MAP,
);

export const MAX_SORT_COLUMN_HISTORY = 2 as const;
