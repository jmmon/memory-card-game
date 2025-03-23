import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import { useTimer } from "~/v3/hooks/useTimer";
import deckUtils from "~/v3/utils/deckUtils";
import boardUtils from "~/v3/utils/boardUtils";
import INITIAL_STATE, { GAME_SETTINGS } from "./initialState";
import { GAME } from "~/v3/constants/game";
import type {
  iTimer,
  iGameHandlers,
  iGameState,
  iUserSettings,
} from "~/v3/types/types";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");
export type iGameStateWithTimer = iGameState & { timer: iTimer };

export const useGameContextProvider = ({
  userSettings,
}: {
  userSettings: iUserSettings;
}) => {
  const DEBUG = true;
  // state
  const timer = useTimer();
  const state = useStore<iGameStateWithTimer>({
    ...INITIAL_STATE,
    userSettings: {
      ...userSettings,
    },
    timer,
  });

  const shuffleCardPositions = $(function () {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(state.gameData.cards);
    if (DEBUG) console.log("shuffleCardPositions:", { newCards });
    state.gameData.cards = newCards;
  });

  const startShuffling = $(async function (
    count: number = GAME.CARD_SHUFFLE_ROUNDS,
  ) {
    if (DEBUG) console.log("startShuffling");
    await shuffleCardPositions();
    state.gameData.shufflingState = count - 1;
    state.gameData.isLoading = true;
    state.interfaceSettings.settingsModal.isShowing = false;
    if (DEBUG)
      console.log("~~startShuffling:", {
        gameDataShufflingState: state.gameData.shufflingState,
        gameDataIsLoading: state.gameData.isLoading,
        interfaceSettingsSettingsModalIsShowing:
          state.interfaceSettings.settingsModal.isShowing,
      });
  });

  const stopShuffling = $(function () {
    state.gameData.shufflingState = 0;
    state.gameData.isLoading = false;
    if (DEBUG)
      console.log("stopShuffling:", {
        gameDataShufflingState: state.gameData.shufflingState,
        gameDataIsLoading: state.gameData.isLoading,
      });
  });

  const sliceDeck = $(function () {
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds(
      GAME_SETTINGS.deck.fullDeck,
    );
    const cards = deckShuffledByPairs.slice(0, state.userSettings.deck.size);
    state.gameData.cards = cards;
    if (DEBUG)
      console.log("sliceDeck", {
        gameDataCards: state.gameData.cards,
      });
  });

  const initializeDeck = $(async function () {
    if (DEBUG) console.log("initializeDeck:");
    await sliceDeck();
    await startShuffling();
  });

  const calculateAndResizeBoard = $(function (
    boardRef: HTMLDivElement,
    containerRef: HTMLDivElement,
  ) {
    const newBoard = boardUtils.calculateBoardDimensions(
      containerRef,
      boardRef,
    );
    const { cardLayout, boardLayout } = boardUtils.calculateLayouts(
      newBoard.width,
      newBoard.height,
      state.userSettings.deck.size,
    );
    state.cardLayout = cardLayout;
    state.boardLayout = {
      ...state.boardLayout,
      ...boardLayout,
    };
    if (DEBUG)
      console.log("calculateAndResizeBoard:", {
        boardLayout: state.boardLayout,
        cardLayout: state.cardLayout,
      });
  });

  const showSettings = $(function () {
    timer.pause();
    state.interfaceSettings.settingsModal.isShowing = true;
    if (DEBUG)
      console.log("showSettings:", {
        timerIsPaused: timer.state.isPaused,
        ingerfaceSettingsSettingsModalIsShowing:
          state.interfaceSettings.settingsModal.isShowing,
      });
  });

  const hideSettings = $(function () {
    state.interfaceSettings.settingsModal.isShowing = false;
    timer.resume();
    if (DEBUG)
      console.log("hideSettings:", {
        timerIsPaused: timer.state.isPaused,
        ingerfaceSettingsSettingsModalIsShowing:
          state.interfaceSettings.settingsModal.isShowing,
      });
  });

  const isGameEnded = $(function () {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      state.gameData.successfulPairs.length ===
      state.userSettings.deck.size / 2;

    const isWin =
      state.gameData.successfulPairs.length ===
      state.userSettings.deck.size / 2;

    if (DEBUG)
      console.log("isGameEnded:", {
        isEnded,
        isWin,
      });

    if (!isEnded) return { isEnded };
    return { isEnded, isWin };
  });

  const startGame = $(function () {
    if (DEBUG)
      console.log("startGame:", {
        isResetting: timer.state.isStarted,
      });
    if (timer.state.isStarted) {
      timer.reset();
    }
    timer.start();
  });

  const endGame = $(function (isWin: boolean) {
    timer.stop();
    state.interfaceSettings.endOfGameModal.isWin = isWin;
    state.interfaceSettings.endOfGameModal.isShowing = true;
    if (DEBUG)
      console.log("endGame:", {
        isResetting: timer.state.isStarted,
        isWin: state.interfaceSettings.endOfGameModal.isWin,
        endOfGameModalIsShowing:
          state.interfaceSettings.endOfGameModal.isShowing,
      });
  });

  const resetGame = $(async function (settings?: Partial<iUserSettings>) {
    if (DEBUG)
      console.log("resetGame:", {
        newSettings: settings,
      });
    if (settings !== undefined) {
      state.userSettings = {
        ...state.userSettings,
        ...settings,
      };
    }

    // state.gameData = { ...INITIAL_STATE.gameData };

    state.gameData.isStarted = INITIAL_STATE.gameData.isStarted;
    state.gameData.isLoading = INITIAL_STATE.gameData.isLoading;
    state.gameData.isShaking = INITIAL_STATE.gameData.isShaking;
    state.gameData.shufflingState = INITIAL_STATE.gameData.shufflingState;
    state.gameData.flippedCardId = INITIAL_STATE.gameData.flippedCardId;
    state.gameData.mismatchPair = INITIAL_STATE.gameData.mismatchPair;

    state.gameData.selectedCardIds = [
      ...INITIAL_STATE.gameData.selectedCardIds,
    ];
    state.gameData.cards = [...INITIAL_STATE.gameData.cards];
    // state.gameData.mismatchPairs = [...INITIAL_STATE.gameData.mismatchPairs];
    // state.gameData.successfulPairs = [
    //   ...INITIAL_STATE.gameData.successfulPairs,
    // ];
    // state.gameData.mismatchPairs = INITIAL_STATE.gameData.mismatchPairs;
    // state.gameData.successfulPairs = INITIAL_STATE.gameData.successfulPairs;

    state.gameData.mismatchPairs.length = 0;
    state.gameData.successfulPairs.length = 0;

    if (DEBUG)
      console.log("~~resetGame:", {
        gameData: state.gameData,
      });

    await timer.reset();
    await initializeDeck();
    // console.log("game reset");
  });

  // hold the state, and the functions
  const service = {
    state,
    handle: {
      shuffleCardPositions,
      startShuffling,
      stopShuffling,
      sliceDeck,
      initializeDeck,
      calculateAndResizeBoard,
      showSettings,
      hideSettings,
      isGameEnded,
      startGame,
      endGame,
      resetGame,
    },
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
