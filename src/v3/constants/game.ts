import { ThemeEnum } from "../types/types";
import BOARD from "./board";

export type ValueOf<T> = T[keyof T];

export const LogLevel = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
} as const;
export type LogLevelValue = ValueOf<typeof LogLevel>;

export enum DebugTypeEnum {
  HANDLER = "HANDLER",
  HOOK = "HOOK",
  TASK = "TASK",
  SERVICE = "SERVICE",
  RENDER = "RENDER",
}
export type DebugType = keyof typeof DebugTypeEnum;

type Debug = {
  HANDLER: 0 | LogLevelValue;
  HOOK: 0 | LogLevelValue;
  TASK: 0 | LogLevelValue;
  SERVICE: 0 | LogLevelValue;
  RENDER: 0 | LogLevelValue;
};

const isProd = import.meta.env.PROD;
const DEBUG: Debug = {
  HANDLER: isProd ? 0 : LogLevel.ONE,
  HOOK: isProd ? 0 : 0, //LogLevel.TWO,
  TASK: isProd ? 0 : LogLevel.ONE,
  SERVICE: isProd ? 0 : 0,
  RENDER: isProd ? 0 : 0,
} as const;

const AUTO_SHUFFLE_INTERVAL = 10000 as const;
const AUTO_SHUFFLE_DELAY = 10000 as const;

const CARD_SHUFFLE_ROUNDS = 5 as const;

// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 250 as const;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.75 as const;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  BOARD.CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS; // e.g. 700 * .75 - 250 = 275

const CONTAINER_PADDING_PERCENT = 1.5 as const;

const DECK_SIZE_DEFAULT = isProd ? 18 : (52 as const);
const DECK_SIZE_MIN = 6 as const;
const DECK_SIZE_MAX = 52 as const;

/**
 * dictate starting position of deck when dealing out cards on initialization
 *    e.g. x:0.5, y:0.5 for center
 *    e.g. x:0, y:0.5 for left-center
 *    e.g. perhaps x: -.01, y: 0.5 to start slightly further off the left side
 * percents of board dimensions, so does not take into account the header (padding)
 *
 * TODO: error:
 * this is proportionate to the row/col height/widths  so doesn't scale as rows/cols counts increase/decrease
 *    - so on small deck sizes, since rows are large, we need a large number
 *    - but on large deck sizes, a large number will add a ton of distance
 *    - e.g. for going > 1 for the percents
 *    - e.g. 1.1 x => for 52 cards, deck is approximately half off the right side of screen
 *        but for 6 cards, the entire card is on the screen, only slightly offset from right col
 * should be instead a percent of e.g. board width rather than column count
 * because 3col * 1.1 => 3.3 which is about 15% past the column
 * while 8col * 1.1 = 8.8 which is 40% past the column
 *
 * TODO: also, large deck sizes take a long time to deal...
 *
 * NOTE: so these are board slots, e.g. 1,1 is the last slot and the last row,
 *  while 0,0 is the first slot and the first row
 *  - that's why it doesn't scale well, because at 3 cols 2 rows then the step between cols is 0, 0.5, 1 === 0.5 per step, so it takes 0.5 to move an entire slot over
 *  but at 8 cols * 6 rows is ~0.14 per step, so it only takes 0.14 to move an entire slot over
 *    - perhaps take the card-scale into account? cardLayout
 *    or have a secondary number to account for extra padding, along with the regular x and y
 *
 *  - or have the deck be a standard size no matter the board layout? e.g. 150 * 250 or whatever (or a percent of width/height so it's responsive)
 *    - like the scale up transform, how it is limited by either height or width, but with a lot more padding so it only takes up 1/3 of the board
 *    - or 1/4 or less, not sure
 * */
const DECK_INITIALIZATION_START_POSITION_BOARD_PERCENTS = {
  percentX: 0.5,
  percentY: 0.5,
} as const;

const DATA_THEME = "data-theme" as const;
const STORAGE_KEY_THEME = "theme" as const;

const GAME = {
  AUTO_SHUFFLE_INTERVAL,
  AUTO_SHUFFLE_DELAY,
  CARD_SHUFFLE_ROUNDS,
  START_SHAKE_ANIMATION_EAGER_MS,
  START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE,
  SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
  CONTAINER_PADDING_PERCENT,
  DECK_SIZE_DEFAULT,
  DECK_SIZE_MIN,
  DECK_SIZE_MAX,
  DECK_INITIALIZATION_START_POSITION_BOARD_PERCENTS,
  DATA_THEME,
  STORAGE_KEY_THEME,
  ThemeEnum,
  DEBUG,
} as const;

export default GAME;
