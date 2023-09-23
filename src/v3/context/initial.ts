import { $ } from "@builder.io/qwik";
import type { iGameData } from "../types/types";
import CONSTANTS from "../utils/constants";
import { formattedDeck } from "../utils/cards";
import type { iGameSettings, iGameContext } from "../types/types";
import deckUtils from "../utils/deckUtils";
import {
  calculateBoardDimensions,
  calculateLayouts,
} from "../utils/boardUtils";
import serverDbService from "../services/db.service";
import type { Score } from "../db/types";

const INITIAL_GAME_STATE: iGameData = {
  isSaved: false,
  cards: [],
  mismatchPair: "",
  isShaking: false,
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  shufflingState: 0,
  isFlipped: false,
  isFaceShowing: false,
  isFaceShowing_delayedOff: false,
  isReturned: true,
  isEnded: false,
};

export const INITIAL_STATE = {
  boardLayout: {
    width: 291.07,
    height: 281.81,
    area: 291.07 * 281.81,
    columns: 5,
    rows: 4,
    isLocked: false, // prevent recalculation of board layout
    colWidth: 291.07 / 5, // width / cols
    rowHeight: 281.81 / 4, // height / rows
  },

  cardLayout: {
    width: 50.668,
    height: 70.3955,
    roundedCornersPx: 2.533,
    area: 50.668 * 70.3955,
    colGapPercent: 0,
    rowGapPercent: 0,
  },
  game: INITIAL_GAME_STATE,

  settings: {
    cardFlipAnimationDuration: 800,

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

    resizeBoard: false,

    deck: {
      size: CONSTANTS.CARD.COUNT,
      isLocked: false,
      MINIMUM_CARDS: 6,
      MAXIMUM_CARDS: 52,
      fullDeck: formattedDeck,
    },

    interface: {
      showSelectedIds: false,
      showDimensions: false,
    },
  },
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
    scoresModal: {
      isShowing: false,
      scores: [],
    },
  },

  shuffleCardPositions: $(function (this: iGameContext) {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(this.game.cards);
    console.log("shuffleCardPositions:", { newCards });
    this.game.cards = newCards;
  }),

  startShuffling: $(function (
    this: iGameContext,
    count: number = CONSTANTS.GAME.SHUFFLE_ROUNDS
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
    const deckShuffledByPairs = deckUtils.sliceRandomPairsFromDeck([
      ...this.settings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.settings.deck.size);
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
      this.settings.deck.size
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
      this.game.successfulPairs.length === this.settings.deck.size / 2;
    console.log({ isEnded });

    if (!isEnded) return { isEnded };

    const isWin =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    console.log({ isEnded, isWin });
    return { isEnded, isWin };
  }),

  startGame: $(async function (this: iGameContext) {
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();
  }),

  endGame: $(async function (this: iGameContext, isWin: boolean) {
    this.timer.stop();
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
  }),

  resetGame: $(async function (
    this: iGameContext,
    settings?: Partial<iGameSettings>
  ) {
    if (settings) {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }
    this.game = INITIAL_GAME_STATE;
    await this.timer.reset();
    this.initializeDeck();
  }),

  fetchScores: $(async function (this: iGameContext) {
    console.log("getting all scores...");
    const scores = (await serverDbService.scores.getAll()) as Score[];
    this.interface.scoresModal.scores = scores;
    console.log({ scores });
    return scores;
  }),
};
