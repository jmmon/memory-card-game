import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import INITIAL_STATE from "./initialState";
import { useTimer } from "~/v3/hooks/useTimer";
import {
  iTimer,
  iGameHandlers,
  iGameState,
  iUserSettings,
} from "~/v3/types/types";
import { GAME } from "~/v3/constants/game";
import deckUtils from "~/v3/utils/deckUtils";
import {
  calculateBoardDimensions,
  calculateLayouts,
} from "~/v3/utils/boardUtils";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export type iGameStateWithTimer = iGameState & { timer: iTimer };

export const useGameContextProvider = () => {
  // state
  const timer = useTimer();
  const state = useStore<iGameStateWithTimer>({
    ...INITIAL_STATE,
    timer,
  });

  // functions

  const handlers: iGameHandlers = {
    shuffleCardPositions: $(function () {
      // shuffle and set new positions, save old positions
      const newCards = deckUtils.shuffleCardPositions(state.gameData.cards);
      // console.log("shuffleCardPositions:", { newCards });
      state.gameData.cards = newCards;
    }),
    startShuffling: $(async function (
      this: iGameHandlers,
      count: number = GAME.CARD_SHUFFLE_ROUNDS,
    ) {
      await this.shuffleCardPositions();
      state.gameData.shufflingState = count - 1;
      state.gameData.isLoading = true;
      state.interfaceSettings.settingsModal.isShowing = false;
    }),

    stopShuffling: $(function () {
      state.gameData.shufflingState = 0;
      state.gameData.isLoading = false;
    }),

    sliceDeck: $(function () {
      const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds([
        ...state.gameSettings.deck.fullDeck,
      ]);
      const cards = deckShuffledByPairs.slice(0, state.userSettings.deck.size);
      state.gameData.cards = cards;
    }),
    initializeDeck: $(async function (this: iGameHandlers) {
      await this.sliceDeck();
      await this.startShuffling();
    }),

    calculateAndResizeBoard: $(function (
      boardRef: HTMLDivElement,
      containerRef: HTMLDivElement,
    ) {
      const newBoard = calculateBoardDimensions(containerRef, boardRef);
      const { cardLayout, boardLayout } = calculateLayouts(
        newBoard.width,
        newBoard.height,
        state.userSettings.deck.size,
      );
      state.cardLayout = cardLayout;
      state.boardLayout = {
        ...state.boardLayout,
        ...boardLayout,
      };
    }),

    showSettings: $(function () {
      timer.pause();
      state.interfaceSettings.settingsModal.isShowing = true;
    }),
    hideSettings: $(function () {
      state.interfaceSettings.settingsModal.isShowing = false;
      timer.resume();
    }),

    isGameEnded: $(function () {
      // TODO:
      // implement other modes, like max mismatches
      const isEnded =
        state.gameData.successfulPairs.length ===
        state.userSettings.deck.size / 2;

      if (!isEnded) return { isEnded };

      const isWin =
        state.gameData.successfulPairs.length ===
        state.userSettings.deck.size / 2;

      return { isEnded, isWin };
    }),

    startGame: $(function () {
      if (timer.state.isStarted) {
        timer.reset();
      }
      timer.start();
    }),
    endGame: $(function (isWin: boolean) {
      timer.stop();
      state.interfaceSettings.endOfGameModal.isWin = isWin;
      state.interfaceSettings.endOfGameModal.isShowing = true;
    }),

    resetGame: $(async function (
      this: iGameHandlers,
      settings?: Partial<iUserSettings>,
    ) {
      if (settings !== undefined) {
        state.userSettings = {
          ...state.userSettings,
          ...settings,
        };
      }

      // state.game = INITIAL_STATE.gameData;
      state.gameData.isStarted = INITIAL_STATE.gameData.isStarted;
      state.gameData.isLoading = INITIAL_STATE.gameData.isLoading;
      state.gameData.isShaking = INITIAL_STATE.gameData.isShaking;
      state.gameData.shufflingState = INITIAL_STATE.gameData.shufflingState;
      state.gameData.flippedCardId = INITIAL_STATE.gameData.flippedCardId;
      state.gameData.mismatchPair = INITIAL_STATE.gameData.mismatchPair;

      state.gameData.cards = INITIAL_STATE.gameData.cards;
      state.gameData.mismatchPairs = INITIAL_STATE.gameData.mismatchPairs;
      state.gameData.successfulPairs = INITIAL_STATE.gameData.successfulPairs;
      state.gameData.selectedCardIds = INITIAL_STATE.gameData.selectedCardIds;

      await timer.reset();
      await this.initializeDeck();
      // console.log("game reset");
    }),
  };

  // hold the state, and the functions
  const service = {
    state,
    handle: handlers,
    timer,
  };
  // e.g. ctx.state.gameData, ctx.state.boardLayout,
  // e.g. ctx.timer.state
  // e.g. ctx.handle.shuffleCardPositions

  // provide the service
  useContextProvider(GameContext, service);
  // return for immediate use
  return service;
};

// use the service
export const useGameContextService = () => useContext<GameService>(GameContext);
