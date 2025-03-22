import { GAME } from "~/v3/constants/game";
import { iSelectCardEnum } from "~/v3/types/types";
import type {
  iUserSettings,
  iGameData,
  iGameSettings,
  iGameState,
  iCardLayout,
  iBoardLayout,
  iInterfaceSettings,
} from "~/v3/types/types";
import { formattedDeck } from "~/v3/utils/cards";

const GAME_DATA: iGameData = {
  isStarted: false,
  cards: [],
  mismatchPair: "",
  isShaking: false,
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  shufflingState: 0,
};

// user controlled settings
const USER_SETTINGS: iUserSettings = {
  /* TODO:======================================
   * NOT IMPLEMENTED
   * fun ideas for challenges
   * ====================================== */

  /*
   * TODO: maxAllowableMismatches: number;
   * @default -1 // no limit
   * challenge mode
   * Player loses after x mismatches
   * - perhaps the square root of the number of cards?
   *   - e.g. 9 cards gives 3 chances, 3rd mismatch = fail
   *   - e.g. 16 cards gives 4 chances, 4th mismatch = fail
   */
  maxAllowableMismatches: -1,
  /*
   * TODO:reorganizeBoardOnGaps: boolean;
   * @default false
   * Reorganize board on successful pair (eliminate gaps and resize)
   */
  reorgnanizeBoardOnGaps: false,

  /* TODO:
   * challenge mode
   * shuffle board after successful pair
   */
  shuffleBoardAfterPair: false,
  /* TODO:
   * shuffle board after x mismatches
   *  0 = off (default)
   *  1 = shuffle board after every mismatch (really difficult)
   *  5 = shuffle board after every 5 mismatches (less difficult)
   * */
  shuffleBoardAfterMismatches: 0,
  /* TODO:
   * shuffle board after every round (success OR mismatch)
   */
  shuffleBoardAfterEveryRound: false,
  /* TODO:
   * shuffle picked cards after placed back down after mismatch
   * e.g. possibly swap the two cards to the opposite locations?
   */
  shufflePickedAfterMismatch: false,
  /*
   * TODO:shuffleBoardOnSelectCard: SelectCardEnum
   * @default OFF
   *  - ONE = shuffle cards after picking first card
   *  - TWO = shuffle cards after picking second card
   *  - BOTH = shuffle cards after picking either card (two shuffles per round!)
   */
  shuffleBoardOnSelectCard: iSelectCardEnum.OFF,

  /* TODO:======================================
   * end NOT IMPLEMENTED
   * ====================================== */

  deck: {
    size: GAME.DEFAULT_CARD_COUNT,
    isLocked: false,
  },

  board: {
    isLocked: false, // prevent recalculation of board layout
    resize: false,
  },

  interface: {
    showSelectedIds: false,
    showDimensions: false,
    // TODO: dark mode features
    // slider to dim the cards, e.g. 100%-10% as alternate to invert
    brightness: 100,
    // TODO: dark mode features
    // invert the card colors and hue rotate 180 to fix red
    invertCardColors: false,
  },
};

// unadjustable settings
const GAME_SETTINGS: iGameSettings = {
  cardFlipAnimationDuration: 800,

  deck: {
    fullDeck: formattedDeck,
  },
};

const INTERFACE_SETTINGS: iInterfaceSettings = {
  isScrollable: false,
  successAnimation: false,
  mismatchAnimation: false,
  inverseSettingsModal: {
    isShowing: false,
  },
  settingsModal: {
    isShowing: false,
  },
  endOfGameModal: {
    isShowing: false,
    isWin: false,
  },
};

const BOARD_LAYOUT: iBoardLayout = {
  width: 291.07,
  height: 281.81,
  area: 291.07 * 281.81,
  columns: 5,
  rows: 4,
  colWidth: 291.07 / 5,
  rowHeight: 281.81 / 4,
};

const CARD_LAYOUT: iCardLayout = {
  width: 50.668,
  height: 70.3955,
  roundedCornersPx: 2.533,
  area: 50.668 * 70.3955,
  colGapPercent: 0,
  rowGapPercent: 0,
};

const INITIAL_STATE: iGameState = {
  boardLayout: BOARD_LAYOUT,
  cardLayout: CARD_LAYOUT,
  gameData: GAME_DATA,
  userSettings: USER_SETTINGS,
  gameSettings: GAME_SETTINGS,
  interfaceSettings: INTERFACE_SETTINGS,
};
export default INITIAL_STATE;
