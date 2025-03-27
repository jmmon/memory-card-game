import { $ } from "@builder.io/qwik";
import GAME from "../constants/game";
import { iSelectCardEnum } from "../types/types";
import type {
  iGameData,
  iGameContext,
  iGameSettings,
  iUserSettings,
} from "../types/types";
import { formattedDeck } from "../utils/cards";
import deckUtils from "../utils/deckUtils";
import {
  calculateBoardDimensions,
  calculateLayouts,
} from "../utils/boardUtils";

export const INITIAL_GAME_STATE: iGameData = {
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
export const INITIAL_USER_SETTINGS: iUserSettings = {
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
export const INITIAL_GAME_SETTINGS: iGameSettings = {
  cardFlipAnimationDuration: 800,

  deck: {
    fullDeck: formattedDeck,
  },
};

export const INITIAL_STATE = {
  boardLayout: {
    width: 291.07,
    height: 281.81,
    area: 291.07 * 281.81,
    columns: 5,
    rows: 4,
    colWidth: 291.07 / 5,
    rowHeight: 281.81 / 4,
  },

  cardLayout: {
    width: 50.668,
    height: 70.3955,
    roundedCornersPx: 2.533,
    area: 50.668 * 70.3955,
    colGapPercent: 0,
    rowGapPercent: 0,
  },

  gameData: INITIAL_GAME_STATE,

  userSettings: INITIAL_USER_SETTINGS,

  gameSettings: INITIAL_GAME_SETTINGS,

  interfaceSettings: {
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
  },

  shuffleCardPositions: $(function (this: iGameContext) {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(this.gameData.cards);
    // console.log("shuffleCardPositions:", { newCards });
    this.gameData.cards = newCards;
  }),

  startShuffling: $(function (
    this: iGameContext,
    count: number = GAME.CARD_SHUFFLE_ROUNDS,
  ) {
    this.shuffleCardPositions();
    this.gameData.shufflingState = count - 1;
    this.gameData.isLoading = true;
    this.interfaceSettings.settingsModal.isShowing = false;
  }),

  stopShuffling: $(function (this: iGameContext) {
    this.gameData.shufflingState = 0;
    this.gameData.isLoading = false;
  }),

  sliceDeck: $(function (this: iGameContext) {
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds([
      ...this.gameSettings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.userSettings.deck.size);
    this.gameData.cards = cards;
  }),
  initializeDeck: $(async function (this: iGameContext) {
    await this.sliceDeck();
    this.startShuffling();
  }),

  calculateAndResizeBoard: $(function (
    this: iGameContext,
    boardRef: HTMLDivElement,
    containerRef: HTMLDivElement,
  ) {
    const newBoard = calculateBoardDimensions(containerRef, boardRef);
    const { cardLayout, boardLayout } = calculateLayouts(
      newBoard.width,
      newBoard.height,
      this.userSettings.deck.size,
    );
    this.cardLayout = cardLayout;
    this.boardLayout = {
      ...this.boardLayout,
      ...boardLayout,
    };
  }),

  showSettings: $(function (this: iGameContext) {
    this.timer.pause();
    this.interfaceSettings.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: iGameContext) {
    this.interfaceSettings.settingsModal.isShowing = false;
    this.timer.resume();
  }),

  isGameEnded: $(function (this: iGameContext) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.gameData.successfulPairs.length === this.userSettings.deck.size / 2;

    if (!isEnded) return { isEnded };

    const isWin =
      this.gameData.successfulPairs.length === this.userSettings.deck.size / 2;

    return { isEnded, isWin };
  }),

  startGame: $(function (this: iGameContext) {
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();
  }),
  endGame: $(function (this: iGameContext, isWin: boolean) {
    this.timer.stop();
    this.interfaceSettings.endOfGameModal.isWin = isWin;
    this.interfaceSettings.endOfGameModal.isShowing = true;
  }),

  resetGame: $(async function (
    this: iGameContext,
    settings?: Partial<iUserSettings>,
  ) {
    if (settings !== undefined) {
      this.userSettings = {
        ...this.userSettings,
        ...settings,
      };
    }

    // this.game = INITIAL_GAME_STATE;
    this.gameData.isStarted = INITIAL_GAME_STATE.isStarted;
    this.gameData.isLoading = INITIAL_GAME_STATE.isLoading;
    this.gameData.isShaking = INITIAL_GAME_STATE.isShaking;
    this.gameData.shufflingState = INITIAL_GAME_STATE.shufflingState;
    this.gameData.flippedCardId = INITIAL_GAME_STATE.flippedCardId;
    this.gameData.mismatchPair = INITIAL_GAME_STATE.mismatchPair;

    this.gameData.cards = INITIAL_GAME_STATE.cards;
    this.gameData.mismatchPairs = INITIAL_GAME_STATE.mismatchPairs;
    this.gameData.successfulPairs = INITIAL_GAME_STATE.successfulPairs;
    this.gameData.selectedCardIds = INITIAL_GAME_STATE.selectedCardIds;

    await this.timer.reset();
    await this.initializeDeck();
    // console.log("game reset");
  }),
};
