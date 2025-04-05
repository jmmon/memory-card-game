import { ThemeEnum } from "../types/types";
import BOARD from "./board";

// enum LoggingEnum {
//   log = "log",
//   debug = "debug",
//   info = "info",
//   warn = "warn",
//   error = "error",
//   assert = "assert",
// }
// const DEBUG: {
//   HANDLERS: keyof typeof LoggingEnum | false;
//   HOOKS: keyof typeof LoggingEnum | false;
//   TASKS: keyof typeof LoggingEnum | false;
// } = {
//   HANDLERS: false,
//   HOOKS: LoggingEnum.warn,
//   TASKS: false,
// } as const;

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
  HOOK: isProd ? 0 : LogLevel.TWO,
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
  START_SHAKE_ANIMATION_EAGER_MS;

const DEFAULT_CARD_COUNT = 18 as const;

const CONTAINER_PADDING_PERCENT = 1.5 as const;
const MIN_CARD_COUNT = 6 as const;
const MAX_CARD_COUNT = 52 as const;

const DATA_THEME = "data-theme" as const;
const STORAGE_KEY_THEME = "theme" as const;

const GAME = {
  AUTO_SHUFFLE_INTERVAL,
  AUTO_SHUFFLE_DELAY,
  CARD_SHUFFLE_ROUNDS,
  START_SHAKE_ANIMATION_EAGER_MS,
  START_SHAKE_WHEN_FLIP_DOWN_IS_PERCENT_COMPLETE,
  SHAKE_ANIMATION_DELAY_AFTER_STARTING_TO_RETURN_TO_BOARD,
  DEFAULT_CARD_COUNT,
  CONTAINER_PADDING_PERCENT,
  MIN_CARD_COUNT,
  MAX_CARD_COUNT,
  DATA_THEME,
  STORAGE_KEY_THEME,
  ThemeEnum,
  DEBUG,
} as const;

export default GAME;
