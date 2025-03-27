import type { DebugTypeEnum} from "../constants/game";
import { type LogLevelValue } from "../constants/game";
import GAME from "../constants/game";

const logger = (
  type: keyof typeof DebugTypeEnum,
  logLevel: LogLevelValue,
  ...args: any[]
) => {
  if (GAME.DEBUG[type] >= logLevel) {
    // const time = String(Date.now() / 1000).substring(6);
    const now = performance.now();
    // const time = `${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    const time = `${now.toFixed(1)}`;

    // .toTimeString().split(" ")[0];
    console.log(time, ...args);
  }
};
// logger(hooks, "~~syncing theme from localstorage:", {theme: themeFromLocalStorage});
export default logger;
