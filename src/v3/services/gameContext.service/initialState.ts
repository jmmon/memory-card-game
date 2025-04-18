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
  lastClick: -1,
  gameState: GameStateEnum.IDLE,
  cards: [],
  mismatchPair: "",
  isShaking: false, // to show shaking? for mismatch pair. Wonder if can be combined with header mismatchAnimation?
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  /** new start trigger for intervalOccurrences */
  isShuffling: false,
  /** constant set before starting shuffling */
  shuffleRounds: GAME.CARD_SHUFFLE_ROUNDS,
  /** for determining where deck is dealt from */
  startingPosition: { x: 0, y: 0 },

  /** when dealing, counts down from max cards to 0 
   * so current card index === deck.size - dealCardIndex
   * */
  dealCardIndex: 0,
};

// user controlled settings
const USER_SETTINGS: iUserSettings = {
  /* TODO:======================================
   * NOT IMPLEMENTED
   * fun ideas for challenges
   * ====================================== */

  /**
   * how to score for challenge modes?
   * I guess have to track each of them.
   * */

  /*
   * TODO: maxAllowableMismatches: number; (range 0-(pairs - 1) e.g. 2-25)
   *    but it gets exponentailly harder with increased count, guess that's just the challenge!
   *    e.g. 52 cards => 25 max mismatches allowed by the slider
   * @default -1 // no limit
   * challenge mode
   * Player loses after x mismatches
   * - perhaps the square root of the number of cards?
   *   - e.g. 9 cards gives 3 chances, 3rd mismatch = fail
   *   - e.g. 16 cards gives 4 chances, 4th mismatch = fail
   * e.g. implement logic in isEndGameConditionsMet to check mismatches count
   *  and implement a slider/counter
   * => leads to potentially a heavy challenge
   * challenge level: n
   */
  maxAllowableMismatches: -1,
  /*
   * TODO:reorganizeBoardOnGaps: boolean;
   * @default false
   * Reorganize board on successful pair (eliminate gaps and resize)
   * e.g. splice out the pair cards and recalculate board
   *   and implement a toggle
   * => leads to slight confusion
   * challenge level: 1
   */
  reorgnanizeBoardOnGaps: false,

  /* TODO:
   * shuffle board after successful pair
   *  >>
   *  >> e.g. handleAddToSuccessfulPairsIfMatching will shuffle after pair only
   *  >>
   *  >> => leads to less than 1 shuffle per round
   *  >>  challenge level: 2
   */
  shuffleBoardAfterPair: false,
  /* TODO:
   * shuffle board after x mismatches (range 0-5? or 0-(pairs - 1))
   *  >> 0 = off (default)
   *  >> 1 = shuffle board after every mismatch (really difficult)
   *  >> 5 = shuffle board after every 5 mismatches (less difficult)
   *  >> 
   *  >>  e.g. if > 0, take mismatches % n and shuffle if 0
   *  >> 
   *  >>  => leads to less than 1 shuffle per round
   *  >>  challenge level: 1 | 2
   * */
  shuffleBoardAfterMismatches: 0,
  /* TODO:
   * shuffle board after every round (success OR mismatch)
   *  >>
   *  >> e.g. handleAddToSuccessfulPairsIfMatching will finally shuffle
   *  >>
   *  >> => leads to 1 shuffle per round
   *  >> challenge level: 2
   * */
  shuffleBoardAfterEveryRound: false,
  /* TODO:
   *  >> shuffle picked cards after placed back down after mismatch
   *  >> e.g. possibly swap the two cards to the opposite locations?
   *  >> not much of a challenge mode but why not
   *  >>
   *  >> e.g. handleAddToSuccessfulPairsIfMatching if mismatch, will also swap the two card positions
   *  >>
   *  >> => leads to only slightly confusing two cards
   *  >> challenge level: 1
   */
  shufflePickedAfterMismatch: false,
  /*
   * TODO:
   * shuffleBoardOnSelectCard: SelectCardEnum
   *  >> @default OFF
   *  >>  - ONE = shuffle cards after picking first card
   *  >>  - TWO = shuffle cards after picking second card
   *  >>  - BOTH = shuffle cards after picking either card (two shuffles per round!)
   *  >>
   *  >>  e.g. probably do this after unflipping the card, or else the flip
   *  >>      animation might do a 180 while it's picked
   *  >>    OR do it right once picking the card, but still might make the animation look funny
   *  >>
   *  >>  => leads to 1-2 shuffles per round!
   *  >>  challenge level: 2 | 3
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
