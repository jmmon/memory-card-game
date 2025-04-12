import type { DebugType } from "../constants/game";
import { type LogLevelValue } from "../constants/game";
import GAME from "../constants/game";
/**
 * @example logger(DebugTypeEnum.SERVICE, LogLevel.ONE, "~~syncing theme from localstorage:", {theme: themeFromLocalStorage});
 * */
const logger = (
  type: DebugType,
  logLevel: LogLevelValue,
  ...logArgs: any[]
) => {
  if (GAME.DEBUG[type] >= logLevel) {
    const now = performance.now();
    const time = `${(now / 1000).toFixed(4)}`;
    console.log(time, ...logArgs);
  }
};
export default logger;
