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
    hideSettings: boolean = false,
    count: number = GAME.CARD_SHUFFLE_ROUNDS,
  ) {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "startShuffling");
      state.gameData.dealCardIndex = 0; // reset just in case

    await shuffleCardPositions();
    state.gameData.shufflingState = count - 1;
    state.gameData.isLoading = true;
    if (hideSettings) {
      state.interfaceSettings.settingsModal.isShowing = false;
    }

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
    const deckShuffledByPairs = deckUtils
      .shuffleDeckAndRefreshIds(FULL_DECK)
      .map((card) => ({ ...card, position: -1 }));
    const cards = deckShuffledByPairs.slice(0, state.userSettings.deck.size);
    state.gameData.cards = cards;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "sliceDeck", {
      gameDataCards: state.gameData.cards,
    });
  });

  const lastDeal = useSignal(Date.now());

  const dealCard = $(function () {
    // set new position
    const currentIndex =
      state.userSettings.deck.size - state.gameData.dealCardIndex;
    state.gameData.cards[currentIndex].position = currentIndex;
    const now = Date.now();
    const dealInterval = now - lastDeal.value;
    logger(DebugTypeEnum.HANDLER, LogLevel.TWO, "dealCard:", {
      dealCardIndex: state.gameData.dealCardIndex,
      currentCard: state.gameData.cards[currentIndex],
      dealInterval,
    });
    lastDeal.value = now;
    state.gameData.dealCardIndex--;
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

  const lastDeckSize = useSignal(state.userSettings.deck.size);
  //
  // runs on mount, and after resetting game
  const initializeDeck = $(async function (isStartup?: boolean) {
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "initializeDeck");

    const isDeckSizeChanged = lastDeckSize.value !== state.userSettings.deck.size;
    state.gameData.isLoading = true;

    await sliceDeck(); // refresh deck, and size if needed

    // if (isDeckChanged) {
    if ( isStartup || isDeckSizeChanged)
      await calculateAndResizeBoard();
    // }

    // start deck deal animation
    state.gameData.dealCardIndex = state.userSettings.deck.size;
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

    // clear the cards
    state.gameData.cards.length = 0;
    state.gameData.lastClick = -1;

    // ensure scores header resets by changing length
    state.gameData.selectedCardIds.length = 0;
    state.gameData.mismatchPairs.length = 0;
    state.gameData.successfulPairs.length = 0;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "~~resetGame:", {
      gameData: state.gameData,
    });

    await timer.reset();
    await initializeDeck();
  });

  const handlers: iGameHandlers = {
    dealCard,
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
