import { $ } from "@builder.io/qwik";
import { GAME } from "../constants/game";
import type {
  GameData,
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

export const INITIAL_GAME_STATE: GameData = {
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
  /* ===================
   * NOT IMPLEMENTED
   * =================== */
  maxAllowableMismatches: -1,

  /* shuffle board after x mismatches
   *  0 = off
   *  1+ = every n mismatches
   * */
  shuffleBoardAfterMismatches: 0,
  /* shuffle board after successful pair */
  shuffleBoardAfterPair: false,
  /* shuffle board after success OR mismatch */
  shuffleBoardAfterRound: false,

  /* shuffle picked cards after placed back down after mismatch */
  shufflePickedAfterMismatch: false,

  /* recalculate board dimensions (eliminate empty spaces) on pair, on mismatch
   * */
  reorgnanizeBoardOnPair: false,
  reorgnanizeBoardOnMismatch: false,
  /* ===================
   * end NOT IMPLEMENTED
   * =================== */

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

  game: { ...INITIAL_GAME_STATE },

  userSettings: { ...INITIAL_USER_SETTINGS },

  gameSettings: { ...INITIAL_GAME_SETTINGS },

  interface: {
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
    const newCards = deckUtils.shuffleCardPositions(this.game.cards);
    // console.log("shuffleCardPositions:", { newCards });
    this.game.cards = newCards;
  }),

  startShuffling: $(function (
    this: iGameContext,
    count: number = GAME.CARD_SHUFFLE_ROUNDS
  ) {
    this.shuffleCardPositions();
    this.game.shufflingState = count - 1;
    this.game.isLoading = true;
    this.interface.settingsModal.isShowing = false;
  }),

  stopShuffling: $(function (this: iGameContext) {
    this.game.shufflingState = 0;
    this.game.isLoading = false;
  }),

  sliceDeck: $(function (this: iGameContext) {
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds([
      ...this.gameSettings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.userSettings.deck.size);
    this.game.cards = cards;
  }),
  initializeDeck: $(async function (this: iGameContext) {
    await this.sliceDeck();
    this.startShuffling();
  }),

  calculateAndResizeBoard: $(function (
    this: iGameContext,
    boardRef: HTMLDivElement,
    containerRef: HTMLDivElement
  ) {
    const newBoard = calculateBoardDimensions(containerRef, boardRef);
    const { cardLayout, boardLayout } = calculateLayouts(
      newBoard.width,
      newBoard.height,
      this.userSettings.deck.size
    );
    this.cardLayout = cardLayout;
    this.boardLayout = {
      ...this.boardLayout,
      ...boardLayout,
    };
  }),

  showSettings: $(function (this: iGameContext) {
    this.timer.pause();
    this.interface.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: iGameContext) {
    this.interface.settingsModal.isShowing = false;
    this.timer.resume();
  }),

  isGameEnded: $(function (this: iGameContext) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.game.successfulPairs.length === this.userSettings.deck.size / 2;

    if (!isEnded) return { isEnded };

    const isWin =
      this.game.successfulPairs.length === this.userSettings.deck.size / 2;

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
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
  }),

  resetGame: $(async function (
    this: iGameContext,
    settings?: Partial<iUserSettings>
  ) {
    if (settings !== undefined) {
      this.userSettings = {
        ...this.userSettings,
        ...settings,
      };
    }

    // this.game = INITIAL_GAME_STATE;
    this.game.isStarted = INITIAL_GAME_STATE.isStarted;
    this.game.isLoading = INITIAL_GAME_STATE.isLoading;
    this.game.isShaking = INITIAL_GAME_STATE.isShaking;
    this.game.shufflingState = INITIAL_GAME_STATE.shufflingState;
    this.game.flippedCardId = INITIAL_GAME_STATE.flippedCardId;
    this.game.mismatchPair = INITIAL_GAME_STATE.mismatchPair;

    // this.game.cards = [...INITIAL_GAME_STATE.cards];
    // this.game.mismatchPairs = [...INITIAL_GAME_STATE.mismatchPairs];
    // this.game.successfulPairs = [...INITIAL_GAME_STATE.successfulPairs];
    // this.game.selectedCardIds = [...INITIAL_GAME_STATE.selectedCardIds];

    this.game.cards = INITIAL_GAME_STATE.cards;
    this.game.mismatchPairs = INITIAL_GAME_STATE.mismatchPairs;
    this.game.successfulPairs = INITIAL_GAME_STATE.successfulPairs;
    this.game.selectedCardIds = INITIAL_GAME_STATE.selectedCardIds;

    await this.timer.reset();
    await this.initializeDeck();
    // console.log("game reset");
  }),
};
