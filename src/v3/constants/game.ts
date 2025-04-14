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
  UTIL = "UTIL",
}
export type DebugType = keyof typeof DebugTypeEnum;

type Debug = {
  HANDLER: 0 | LogLevelValue;
  HOOK: 0 | LogLevelValue;
  TASK: 0 | LogLevelValue;
  SERVICE: 0 | LogLevelValue;
  RENDER: 0 | LogLevelValue;
  UTIL: 0 | LogLevelValue;
};

const isProd = import.meta.env.PROD;
// const isProd = false;
const DEBUG: Debug = {
  HANDLER: isProd ? 0 : LogLevel.TWO, //0, //LogLevel.ONE,
  HOOK: isProd ? 0 : LogLevel.TWO,
  TASK: isProd ? 0 : LogLevel.ONE,
  SERVICE: isProd ? 0 : 0,
  RENDER: isProd ? 0 : LogLevel.ONE,
  UTIL: isProd ? 0 : LogLevel.ONE,
} as const;

const AUTO_SHUFFLE_INTERVAL = 10000 as const;
const AUTO_SHUFFLE_DELAY = 10000 as const;
const AUTO_PAUSE_DELAY_MS = 10000 as const;

const CARD_SHUFFLE_ROUNDS = 5 as const;

// higher means shake starts sooner
const START_SHAKE_ANIMATION_EAGER_MS = 250 as const;
const START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE = 0.75 as const;
const SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD =
  BOARD.CARD_FLIP_ANIMATION_DURATION *
    START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE -
  START_SHAKE_ANIMATION_EAGER_MS; // e.g. 700 * .75 - 250 = 275

const CONTAINER_PADDING_PERCENT = 1.5 as const;

const DECK_SIZE_DEFAULT = isProd ? 18 : (18 as const);
const DECK_SIZE_MIN = 6 as const;
const DECK_SIZE_MAX = 52 as const;

// want to keep it reasonable across all deck sizes
// so now it takes a base of ~1.5s divided by the cards,
// and adds a small additional flat value
// so 52 cards will take longer, but it still starts at the same base value
// e.g. 1500 base across the cards, + 35ms per card
//  - e.g. 6 cards == 1500 + 210 => 1710ms / 6 = 285ms per card
//  - e.g. 18 cards == 1500 + 35*18 = 1500 + 630 => 2130ms / 18 = ~118ms per card
//  - e.g. 32 cards == 1500 + 35*32 = 1500 + 70 + 1050 => 2620ms / 32 = ~82ms per card
//  - e.g. 52 cards == 1500 + 35*52 = 1500 + 1400 + 420 => 3320ms == ~64ms per card
//
//  adjust to 25ms percard:
//  6 => 1500 + 150 => 1650ms total (reduced by 60ms) / 6 = 275ms
//  52 => 1500 + 25*52 => 1500 + 1300 => 2800ms total (reduced by 520ms) / 52 = 54ms per card
//
//adjust to 20ms per card:
//  6 => 1500 + 120 => 1620 total (total reduction of 90ms) => 270ms each
//      actual 2430ms
//  18 => 1500 + 450 => 1950 total  => 108ms
//      actual 2073ms
//  52 => 1500 + 20*52 => 1500 + 1040 => 2540ms total (total reduction of 780ms) = 49ms per card
//      actual 2686

const FAN_OUT_DURATION_BASE_MS = 1500 as const;
const FAN_OUT_DURATION_ADDITIONAL_PER_CARD_MS = 35 as const;

/**
 * dictate starting position of deck when dealing out cards on initialization
 *    e.g. x:0.5, y:0.5 for center
 *    e.g. x:0, y:0.5 for left-center
 *    e.g. perhaps x: -.01, y: 0.5 to start slightly further off the left side
 * percents of board dimensions, so does not take into account the header (padding)
 
 * Percents are now adjusted if above 1 or below 0 so they are not real percents.
 *  - They are accurate to the x-y col/row coords if within 0 to 1
 *    e.g. 1 === last column/row, 0 === first column/row
 *  - If > 1 or < 0, it will adjust the extra to be proportional to the rows/cols
 *  - this way the position is consistent across deck sizes when placed
 *    above 1 or below 0, but it might not work as initially expected
 * */
const DECK_INITIALIZATION_START_POSITION_BOARD_PERCENTS = {
  percentX: 1,
  percentY: 1.6,
} as const;

const DATA_THEME = "data-theme" as const;
const STORAGE_KEY_THEME = "theme" as const;

const DECK_DEAL_SCALE = 1.2;

const GAME = {
  DECK_DEAL_SCALE,
  AUTO_SHUFFLE_INTERVAL,
  AUTO_SHUFFLE_DELAY,
  AUTO_PAUSE_DELAY_MS,
  CARD_SHUFFLE_ROUNDS,
  START_SHAKE_ANIMATION_EAGER_MS,
  START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE,
  SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
  CONTAINER_PADDING_PERCENT,
  DECK_SIZE_DEFAULT,
  DECK_SIZE_MIN,
  DECK_SIZE_MAX,
  DECK_INITIALIZATION_START_POSITION_BOARD_PERCENTS,
  FAN_OUT_DURATION_BASE_MS,
  FAN_OUT_DURATION_ADDITIONAL_PER_CARD_MS,
  DATA_THEME,
  STORAGE_KEY_THEME,
  ThemeEnum,
  DEBUG,
} as const;

export default GAME;
