import type { DebugTypeEnum } from "../constants/game";
import { type LogLevelValue } from "../constants/game";
import GAME from "../constants/game";
/**
 * @example logger(DebugTypeEnum.SERVICE, LogLevel.ONE, "~~syncing theme from localstorage:", {theme: themeFromLocalStorage});
 * */
const logger = (
  type: keyof typeof DebugTypeEnum,
  logLevel: LogLevelValue,
  ...logArgs: any[]
) => {
  if (GAME.DEBUG[type] >= logLevel) {
    const now = performance.now();
    const time = `${now.toFixed(1)}`;
    console.log(time, ...logArgs);
  }
};
export default logger;
