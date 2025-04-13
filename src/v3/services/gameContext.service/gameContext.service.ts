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
import {
  GameStateEnum,
  type iGameHandlers,
  type iState,
  type iUserSettings,
} from "~/v3/types/types";
import logger from "../logger";
import cardUtils from "~/v3/utils/cardUtils";
import type { iTimer } from "~/v3/hooks/useTimer/types";
import { FULL_DECK } from "~/v3/utils/cards";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export const useGameContextProvider = ({
  userSettings,
}: {
  userSettings: iUserSettings;
}) => {
  // state
  const timer: iTimer = useTimer();
  const state = useStore<iState>({
    ...INITIAL_STATE,
    userSettings: {
      ...userSettings,
    },
  });
  const boardRef = useSignal<HTMLDivElement>();
  const containerRef = useSignal<HTMLDivElement>();

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

    logger(DebugTypeEnum.HANDLER, LogLevel.TWO, "~~startShuffling:", {
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
    const deckShuffledByPairs = deckUtils.shuffleDeckAndRefreshIds(FULL_DECK);
    const cards = deckShuffledByPairs.slice(0, state.userSettings.deck.size);
    state.gameData.cards = cards;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "sliceDeck", {
      gameDataCards: state.gameData.cards,
    });
  });

  const lastFanOut = useSignal(Date.now());
  const totalFanOut = useSignal(0);

  const fanOutCard = $(function () {
    state.gameData.currentFanOutCardIndex--;
    if (state.gameData.currentFanOutCardIndex === state.userSettings.deck.size) {
      totalFanOut.value = Date.now(); // take start reading
    }
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "fanOutCard:", {
      currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
    });
    // for skipping, gives a break before shuffle
    if (
      state.gameData.currentFanOutCardIndex < 1 &&
      state.gameData.currentFanOutCardIndex >
        -(state.gameData.fanOutCardDelayRounds - 1)
    ) {
      logger(DebugTypeEnum.HANDLER, LogLevel.TWO, "~~ fanOutCard: paused", {
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
        LogLevel.TWO,
        "~~ fanOutCard: startShuffling",
        {
          currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
          pausedDuration,
          totalDuration: (Date.now() - totalFanOut.value) / 1000 + "s",
        },
      );
      console.log({
          totalDuration: (Date.now() - totalFanOut.value) / 1000 + "s",

      })
      // 2.557s for 18cards
      // 3.962s for 52cards
      startShuffling();
      return;
    }
    // set new position
    const currentIndex =
      state.userSettings.deck.size - state.gameData.currentFanOutCardIndex;
    state.gameData.cards[currentIndex].position = currentIndex;
    logger(DebugTypeEnum.HANDLER, LogLevel.TWO, "fanOutCard:", {
      currentFanOutCardIndex: state.gameData.currentFanOutCardIndex,
      currentCard: state.gameData.cards[currentIndex],
    });
    lastFanOut.value = Date.now();
  });

  const initializeDeck = $(async function () {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "initializeDeck");
    await sliceDeck(); // set to deckSize
    // start fan-out animation (dealing the deck)
    state.gameData.currentFanOutCardIndex = state.userSettings.deck.size + 1;
  });

  const calculateAndResizeBoard = $(function () {
    if (state.userSettings.board.isLocked) {
      logger(
        DebugTypeEnum.HANDLER,
        LogLevel.ONE,
        "calculateAndResizeBoard: BOARD LOCKED",
      );
      return;
    }

    const { width, height } = boardUtils.calculateBoardDimensions(
      containerRef.value as HTMLDivElement,
      boardRef.value as HTMLDivElement,
    );
    const { cardLayout, boardLayout } = boardUtils.calculateLayouts(
      width,
      height,
      state.userSettings.deck.size,
    );
    state.cardLayout = cardLayout;
    state.boardLayout = {
      ...state.boardLayout,
      ...boardLayout,
    };

    // update deck-dealing position when resized
    state.gameData.startingPosition = cardUtils.generateCenterCoords(
      boardLayout.columns,
      boardLayout.rows,
    );

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

  const showEndGameModal = $(function () {
    state.interfaceSettings.endOfGameModal.isShowing = true;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "showEndGameModal:", {
      interfaceSettingsEndOfGameModalIsShowing:
        state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const hideEndGameModal = $(function () {
    state.interfaceSettings.endOfGameModal.isShowing = false;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "hideEndGameModal:", {
      interfaceSettingsEndOfGameModalIsShowing:
        state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const toggleModalOnEscape = $(function () {
    if (
      state.gameData.gameState === GameStateEnum.ENDED &&
      !state.interfaceSettings.settingsModal.isShowing
    ) {
      if (state.interfaceSettings.endOfGameModal.isShowing) {
        hideEndGameModal();
      } else {
        showEndGameModal();
      }
      return;
    }

    if (state.interfaceSettings.settingsModal.isShowing) {
      hideSettings();
    } else {
      showSettings();
    }
  });

  const isEndGameConditionsMet = $(function () {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      state.gameData.successfulPairs.length ===
      state.userSettings.deck.size / 2;

    const isWin =
      state.gameData.successfulPairs.length ===
      state.userSettings.deck.size / 2;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "isEndGameConditionsMet:", {
      isEnded,
      isWin,
    });

    if (!isEnded) return { isEnded };
    return { isEnded, isWin };
  });

  const startGame = $(function () {
    state.gameData.gameState = GameStateEnum.STARTED;
    if (timer.state.isStarted) {
      timer.reset();
    }
    timer.start();

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "startGame:", {
      isResetting: timer.state.isStarted,
    });
  });

  const endGame = $(function (isWin: boolean) {
    state.gameData.gameState = GameStateEnum.ENDED;
    timer.stop();
    state.interfaceSettings.endOfGameModal.isWin = isWin;
    state.interfaceSettings.endOfGameModal.isShowing = true;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "endGame:", {
      isResetting: timer.state.isStarted,
      isWin: state.interfaceSettings.endOfGameModal.isWin,
      endOfGameModalIsShowing: state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const resetGame = $(async function (newSettings?: Partial<iUserSettings>) {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "resetGame:", {
      newSettings: newSettings,
    });
    state.gameData.isLoading = true;
    if (newSettings !== undefined) {
      state.userSettings = {
        ...state.userSettings,
        ...newSettings,
        deck: {
          ...state.userSettings.deck,
          ...newSettings.deck,
        },
        board: {
          ...state.userSettings.board,
          ...newSettings.board,
        },
        interface: {
          ...state.userSettings.interface,
          ...newSettings.interface,
        },
      };
    }

    state.gameData.gameState = GameStateEnum.IDLE;
    state.gameData.isShaking = INITIAL_STATE.gameData.isShaking;
    state.gameData.shufflingState = INITIAL_STATE.gameData.shufflingState;
    state.gameData.flippedCardId = INITIAL_STATE.gameData.flippedCardId;
    state.gameData.mismatchPair = INITIAL_STATE.gameData.mismatchPair;

    state.gameData.cards = [...INITIAL_STATE.gameData.cards];

    // hack to ensure the lengths change to update state (particularly for mismatch and success pairs)
    state.gameData.selectedCardIds.length = 0;
    state.gameData.mismatchPairs.length = 0;
    state.gameData.successfulPairs.length = 0;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "~~resetGame:", {
      gameData: state.gameData,
    });

    await timer.reset();
    await calculateAndResizeBoard();
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
    showEndGameModal,
    hideEndGameModal,
    isEndGameConditionsMet,
    startGame,
    endGame,
    resetGame,
    toggleModalOnEscape,
  };

  // hold the state, and the functions
  const service = {
    state,
    handle: handlers,
    timer,
    boardRef,
    containerRef,
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
