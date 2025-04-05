/* eslint @typescript-eslint/no-unnecessary-condition: "off" */
import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
} from "@builder.io/qwik";
import { useTimer } from "~/v3/hooks/useTimer";
import deckUtils from "~/v3/utils/deckUtils";
import boardUtils from "~/v3/utils/boardUtils";
import INITIAL_STATE from "./initialState";
import GAME, { DebugTypeEnum, LogLevel } from "~/v3/constants/game";
import type {
  iGameHandlers,
  iGameState,
  iUserSettings,
} from "~/v3/types/types";
import logger from "../logger";
import cardUtils from "~/v3/utils/cardUtils";
import { iTimer } from "~/v3/hooks/useTimer/types";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export const useGameContextProvider = ({
  userSettings,
}: {
  userSettings: iUserSettings;
}) => {
  // state
  const timer: iTimer = useTimer();
  const state = useStore<iGameState>({
    ...INITIAL_STATE,
    userSettings: {
      ...userSettings,
    },
  });

  const shuffleCardPositions = $(function () {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(state.gameData.cards);
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "shuffleCardPositions:", {
      newCards,
    });
    state.gameData.cards = newCards;
  });

  const startShuffling = $(async function (
    count: number = GAME.CARD_SHUFFLE_ROUNDS,
  ) {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "startShuffling");

    await shuffleCardPositions();
    state.gameData.shufflingState = count - 1;
    state.gameData.isLoading = true;
    state.interfaceSettings.settingsModal.isShowing = false;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "~~startShuffling:", {
      gameDataShufflingState: state.gameData.shufflingState,
      gameDataIsLoading: state.gameData.isLoading,
      interfaceSettingsSettingsModalIsShowing:
        state.interfaceSettings.settingsModal.isShowing,
    });
  });

  const stopShuffling = $(function () {
    state.gameData.shufflingState = 0;
    state.gameData.isLoading = false;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "stopShuffling:", {
      gameDataShufflingState: state.gameData.shufflingState,
      gameDataIsLoading: state.gameData.isLoading,
    });
  });

  /**
   * gets fresh pairs with fresh ids,
   * slices the deck to appropriate size
   * */
  const sliceDeck = $(function () {
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds(
      INITIAL_STATE.gameSettings.deck.fullDeck,
    );
    const cards = deckShuffledByPairs.slice(0, state.userSettings.deck.size);
    state.gameData.cards = cards;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "sliceDeck", {
      gameDataCards: state.gameData.cards,
    });
  });

  const lastFanOut = useSignal(Date.now());

  const fanOutCard = $(function () {
    state.gameData.currentFanOutCardIndex--;
    // for skipping, gives a break before shuffle
    if (
      state.gameData.currentFanOutCardIndex < 1 &&
      state.gameData.currentFanOutCardIndex >
        -(state.gameData.fanOutCardDelayRounds - 1)
    ) {
      logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "~~ fanOutCard: paused", {
        currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
      });
      return;
    }
    // end the fan-out and start shuffling
    if (
      state.gameData.currentFanOutCardIndex ===
      -(state.gameData.fanOutCardDelayRounds - 1)
    ) {
      const pausedDuration = Date.now() - lastFanOut.value;
      logger(
        DebugTypeEnum.HANDLER,
        LogLevel.ONE,
        "~~ fanOutCard: startShuffling",
        {
          currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
          pausedDuration,
        },
      );
      startShuffling();
      return;
    }
    // set new position
    const currentIndex =
      state.userSettings.deck.size - state.gameData.currentFanOutCardIndex;
    state.gameData.cards[currentIndex].position = currentIndex;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "fanOutCard:", {
      currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
      currentCard: state.gameData.cards[currentIndex],
    });
    lastFanOut.value = Date.now();
  });

  const initializeDeck = $(async function () {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "initializeDeck");
    await sliceDeck(); // set to deckSize
    state.gameData.startingPosition = cardUtils.generateCenterCoords(
      state.boardLayout.columns,
      state.boardLayout.rows,
    );
    // start fan-out animation (dealing the deck)
    state.gameData.currentFanOutCardIndex = state.userSettings.deck.size + 1;
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
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "calculateAndResizeBoard:", {
      boardLayout: state.boardLayout,
      cardLayout: state.cardLayout,
    });
  });

  const showSettings = $(function () {
    timer.pause();
    state.interfaceSettings.settingsModal.isShowing = true;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "showSettings:", {
      timerIsPaused: timer.state.isPaused,
      ingerfaceSettingsSettingsModalIsShowing:
        state.interfaceSettings.settingsModal.isShowing,
    });
  });

  const hideSettings = $(function () {
    state.interfaceSettings.settingsModal.isShowing = false;
    timer.resume();
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "hideSettings:", {
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

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "isGameEnded:", {
      isEnded,
      isWin,
    });

    if (!isEnded) return { isEnded };
    return { isEnded, isWin };
  });

  const startGame = $(function () {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "startGame:", {
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
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "endGame:", {
      isResetting: timer.state.isStarted,
      isWin: state.interfaceSettings.endOfGameModal.isWin,
      endOfGameModalIsShowing: state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const resetGame = $(async function (settings?: Partial<iUserSettings>) {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "resetGame:", {
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

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "~~resetGame:", {
      gameData: state.gameData,
    });

    await timer.reset();
    await initializeDeck();
    // console.log("game reset");
  });

  const handlers: iGameHandlers = {
    fanOutCard,
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
