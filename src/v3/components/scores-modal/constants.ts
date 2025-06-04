import type { SortColumnWithDirection } from "~/v3/types/types";
import { ScoreTableColumnEnum, SortDirectionEnum } from "~/v3/types/types";

export const JAN_1_1970_STRING = "1970-01-01T00:00:00.000Z" as const;

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

export const COL_TITLE_TO_OBJ_KEY_MAP: { [key: string]: ScoreTableColumnEnum } =
  {
    initials: ScoreTableColumnEnum.initials,
    "deck-size": ScoreTableColumnEnum.deck_size,
    pairs: ScoreTableColumnEnum.pairs,
    mismatches: ScoreTableColumnEnum.mismatches,
    "game-time": ScoreTableColumnEnum.game_time_ds,
    date: ScoreTableColumnEnum.created_at,
  } as const;

export const SORT_COLUMN_MAP: {
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
    direction: SortDirectionEnum.asc,
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

export const SORT_COLUMN_HISTORY_DEFAULT_ORDER = [
  ScoreTableColumnEnum.deck_size,
  ScoreTableColumnEnum.game_time_ds,
  ScoreTableColumnEnum.mismatches,
  ScoreTableColumnEnum.initials,
  ScoreTableColumnEnum.created_at,
  ScoreTableColumnEnum.pairs,
];

export const SORT_COLUMN_HISTORY_DEFAULT_FULL =
  SORT_COLUMN_HISTORY_DEFAULT_ORDER.map(
    (column: ScoreTableColumnEnum) => SORT_COLUMN_MAP[column],
  );

export const SORT_COLUMN_HISTORY_MAX = 3 as const;

export const SORT_COLUMN_HISTORY_DEFAULT_SLICED =
  SORT_COLUMN_HISTORY_DEFAULT_FULL.slice(0, SORT_COLUMN_HISTORY_MAX);

export const ROW_COUNT_OPTIONS = [25, 50, 100, 200] as const;

export const ROW_COUNT_DEFAULT = 25 as const;

