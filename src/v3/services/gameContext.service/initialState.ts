import GAME from "~/v3/constants/game";
import { ThemeEnum, iSelectCardEnum, GameStateEnum } from "~/v3/types/types";
import type {
  iUserSettings,
  iGameData,
  iGameSettings,
  iState,
  iCardLayout,
  iBoardLayout,
  iInterfaceSettings,
  iTheme,
} from "~/v3/types/types";

const GAME_DATA: iGameData = {
  gameState: GameStateEnum.IDLE,
  cards: [],
  mismatchPair: "",
  isShaking: false, // to show shaking? for mismatch pair. Wonder if can be combined with header mismatchAnimation?
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  /** counts down from e.g. 5 to do 5 rounds of card swaps */
  shufflingState: 0,
  /** which card we are currently dealing from deck, counts down from deckSize */
  currentFanOutCardIndex: 0,
  /** counter counts past 0 into negative for this many occurrances */
  fanOutCardDelayRounds: 3, // e.g. if 100ms between rounds, 3 => 300ms delay before shuffling, to give time to finish the fan-out animation
  /** for determining where deck is dealt from */
  startingPosition: { x: 0, y: 0 },

  dealCardIndex: 0,
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
    size: GAME.DECK_SIZE_DEFAULT,
    isLocked: false,
  },

  board: {
    isLocked: false, // prevent recalculation of board layout
  },

  interface: {
    /** developer setting - for testing - also shows card:(index and z-index) */
    showSelectedIds: false,
    /** developer setting - for testing - in header */
    showDimensions: false,
    // TODO: dark mode features
    // slider to dim the cards, e.g. 100%-10% as alternate to invert
    brightness: 100,
    /** inverts cards for a dark mode; gets stored in localstorage */
    invertCardColors: false,
  },
};

// unadjustable settings: needed?
const GAME_SETTINGS: iGameSettings = {};

const INTERFACE_SETTINGS: iInterfaceSettings = {
  isScrollable: false, // not using currently?
  /** controls score header animations */
  successAnimation: false,
  /** controls score header animations */
  mismatchAnimation: false,

  /** not used currently */
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

const INITIAL_STATE: iState = {
  boardLayout: BOARD_LAYOUT,
  cardLayout: CARD_LAYOUT,
  gameData: GAME_DATA,
  userSettings: USER_SETTINGS,
  gameSettings: GAME_SETTINGS,
  interfaceSettings: INTERFACE_SETTINGS,
};

export default INITIAL_STATE;
export const DEFAULT_THEME: iTheme = USER_SETTINGS.interface.invertCardColors
  ? ThemeEnum.dark
  : ThemeEnum.light;
