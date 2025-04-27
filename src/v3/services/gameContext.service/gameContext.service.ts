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
  InitializeDeckOpts,
  ResetGameOpts,
  StartDealingOpts,
  StartShufflingOpts,
  StopDealingOpts,
  iGameData,
} from "~/v3/types/types";
import {
  GameStateEnum,
  type iGameHandlers,
  type iState,
  type iUserSettings,
} from "~/v3/types/types";
import logger from "../logger";
import cardUtils from "~/v3/utils/cardUtils";
import { FULL_DECK } from "~/v3/utils/cards";
import type { UseTimer } from "~/v3/hooks/useTimer/types";

export type GameService = ReturnType<typeof useGameContextProvider>;
const GameContext = createContextId<GameService>("gameContext2");

export const useGameContextProvider = ({
  userSettings,
  gameData,
}: {
  userSettings: Partial<iUserSettings>;
  gameData?: Partial<iGameData>;
}) => {
  // state
  const timer: UseTimer = useTimer();
  const state = useStore<iState>({
    ...INITIAL_STATE,
    userSettings: {
      ...INITIAL_STATE.userSettings,
      ...userSettings,
    },
    gameData: {
      ...INITIAL_STATE.gameData,
      ...gameData,
    },
  });
  const boardRef = useSignal<HTMLDivElement>();
  const containerRef = useSignal<HTMLDivElement>();

  const showSettingsModal = $(function () {
    timer.pause();
    state.interfaceSettings.settingsModal.isShowing = true;
    state.gameData.lastClick = -1;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "showSettings:", {
      timerIsPaused: timer.state.isPaused,
      ingerfaceSettingsSettingsModalIsShowing:
        state.interfaceSettings.settingsModal.isShowing,
    });
  });

  const hideSettingsModal = $(function () {
    state.interfaceSettings.settingsModal.isShowing = false;
    timer.resume();

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "hideSettings:", {
      timerIsPaused: timer.state.isPaused,
      interfaceSettingsSettingsModalIsShowing:
        state.interfaceSettings.settingsModal.isShowing,
    });
  });

  const showScoresModal = $(function () {
    timer.pause();
    state.interfaceSettings.scoresModal.isShowing = true;
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "showScores:", {
      timerIsPaused: timer.state.isPaused,
      interfaceSettingsScoresModalIsShowing:
        state.interfaceSettings.scoresModal.isShowing,
    });
  });

  const hideScoresModal = $(function () {
    state.interfaceSettings.scoresModal.isShowing = false;
    timer.resume();
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "hideScores:", {
      timerIsPaused: timer.state.isPaused,
      ingerfaceSettingsScoresModalIsShowing:
        state.interfaceSettings.scoresModal.isShowing,
    });
  });

  const showEndOfGameModal = $(function () {
    state.interfaceSettings.endOfGameModal.isShowing = true;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "showEndGameModal:", {
      interfaceSettingsEndOfGameModalIsShowing:
        state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const hideEndOfGameModal = $(function () {
    state.interfaceSettings.endOfGameModal.isShowing = false;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "hideEndGameModal:", {
      interfaceSettingsEndOfGameModalIsShowing:
        state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  // TODO: use only one modal but swap the contents?
  // e.g. modalContents = "scores" | "endOfGame" | "settings"
  // height/width would be animated
  const toggleModal = $(function () {
    if (state.interfaceSettings.scoresModal.isShowing) {
      hideScoresModal();
      return;
    }

    // if game has ended (and settings is not shown) then toggle endOfGameModal
    if (
      (state.gameData.gameState === GameStateEnum.ENDED_WIN ||
        state.gameData.gameState === GameStateEnum.ENDED_LOSE) &&
      !state.interfaceSettings.settingsModal.isShowing
    ) {
      if (state.interfaceSettings.endOfGameModal.isShowing) {
        hideEndOfGameModal();
      } else {
        showEndOfGameModal();
      }
      return;
    }

    // else toggle settings modal
    if (state.interfaceSettings.settingsModal.isShowing) {
      hideSettingsModal();
    } else {
      showSettingsModal();
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
    timer.stop();
    state.gameData.gameState = isWin
      ? GameStateEnum.ENDED_WIN
      : GameStateEnum.ENDED_LOSE;
    showEndOfGameModal();

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "endGame:", {
      isStarted: timer.state.isStarted,
      isWin,
      endOfGameModalIsShowing: state.interfaceSettings.endOfGameModal.isShowing,
    });
  });

  const readyGame = $(function () {
    state.gameData.shouldCloseModalDuringDeckAnimations = false;
    state.gameData.isLoading = false;
  });

  // also generates coords for deck dealing position
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
    state.boardLayout = boardLayout;

    // update deck-dealing position when resized
    state.gameData.startingCoords = cardUtils.generateCenterCoords(
      boardLayout.columns,
      boardLayout.rows,
    );

    // update deck-dealing scale
    state.gameData.startingScale = Math.max(
      cardUtils.generateScale(boardLayout, cardLayout), GAME.DECK_DEAL_SCALE_MIN,
    );

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "calculateAndResizeBoard:", {
      boardLayout,
      cardLayout,
    });
  });

  /**
   * gets fresh pairs with fresh ids,
   * slices the deck to appropriate size
   * sets position to -1 for dealing deck position
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

  const DEFAULT_OPTS_START_DEALING: StartDealingOpts = {
    shouldHideSettings: false,
  };
  /** only called from resetGame currently
   * */
  const startDealing = $(function (opts?: Partial<StartDealingOpts>) {
    const { shouldHideSettings } = {
      ...DEFAULT_OPTS_START_DEALING,
      ...opts,
    };
    state.gameData.dealCardIndex = state.userSettings.deck.size;
    state.gameData.isLoading = true;
    state.gameData.isDealing = true;

    if (
      shouldHideSettings &&
      state.gameData.shouldCloseModalDuringDeckAnimations
    ) {
      hideSettingsModal();
    }
  });

  // track for changed deck size for recalculating board
  const lastDeckSize = useSignal(state.userSettings.deck.size);

  const DEFAULT_OPTS_INITIALIZE_DECK: InitializeDeckOpts = {
    forceRecalculateBoard: false,
  };
  /** currently only called from resetGame
   * */
  const initializeDeck = $(async function (opts?: Partial<InitializeDeckOpts>) {
    const { forceRecalculateBoard } = {
      ...DEFAULT_OPTS_INITIALIZE_DECK,
      ...opts,
    };
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "initializeDeck");

    const isDeckSizeChanged =
      lastDeckSize.value !== state.userSettings.deck.size;

    lastDeckSize.value = state.userSettings.deck.size;

    await sliceDeck(); // refresh deck, and size if needed

    if (forceRecalculateBoard || isDeckSizeChanged) {
      await calculateAndResizeBoard();
    }

    // make sure we change this before dealing so you don't open the end-game modal
    state.gameData.gameState = GameStateEnum.IDLE;
    
    startDealing({
      shouldHideSettings: true,
    });
  });

  const DEFAULT_OPTS_RESET_GAME: ResetGameOpts = {
    forceRecalculateBoard: false, // for first run e.g. startup
    shouldCloseModalDuringDeckAnimations: false,
  };
  /** called at init or after saving settings and resetting game
   * */
  const resetGame = $(async function (
    newSettings?: Partial<iUserSettings>,
    opts?: Partial<ResetGameOpts>,
  ) {
    const { forceRecalculateBoard, shouldCloseModalDuringDeckAnimations } = {
      ...DEFAULT_OPTS_RESET_GAME,
      ...opts,
    };
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

    state.interfaceSettings.endOfGameModal.isShowing = false;
    state.interfaceSettings.settingsModal.isShowing = false;

    state.gameData.isSaved = false;
    state.gameData.isShaking = INITIAL_STATE.gameData.isShaking;
    state.gameData.flippedCardId = INITIAL_STATE.gameData.flippedCardId;
    state.gameData.mismatchPair = INITIAL_STATE.gameData.mismatchPair;
    state.gameData.shouldCloseModalDuringDeckAnimations =
      shouldCloseModalDuringDeckAnimations;

    // clear the cards
    state.gameData.cards.length = 0;
    state.gameData.lastClick = -1;
    // stop animations
    state.gameData.isShuffling = false;
    state.gameData.isDealing = false;

    // ensure scores header resets by changing length
    state.gameData.selectedCardIds.length = 0;
    state.gameData.mismatchPairs.length = 0;
    state.gameData.successfulPairs.length = 0;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "resetGame:", {
      newSettings: newSettings,
      gameData: state.gameData,
    });

    await timer.reset();
    await initializeDeck({ forceRecalculateBoard });
  });

  const shuffleCardPositions = $(function () {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(state.gameData.cards);
    state.gameData.cards = newCards;

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "shuffleCardPositions:", {
      newCards,
    });
  });

  // new style with intervalOccurrences
  const DEFAULT_OPTS_START_SHUFFLING: StartShufflingOpts = {
    shouldHideSettings: true,
    shouldShowLoading: true,
    count: GAME.CARD_SHUFFLE_ROUNDS,
  };
  const startShuffling = $(function (opts?: Partial<StartShufflingOpts>) {
    const { shouldHideSettings, shouldShowLoading, count } = {
      ...DEFAULT_OPTS_START_SHUFFLING,
      ...opts,
    };
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "startShuffling");

    state.gameData.shuffleRounds = count; // set occurrences
    state.gameData.isShuffling = true;

    if (shouldShowLoading) {
      state.gameData.isLoading = true;
    }

    // allow keeping settings open if is in initialization
    if (
      shouldHideSettings &&
      state.gameData.shouldCloseModalDuringDeckAnimations
    ) {
      hideSettingsModal();
    }

    logger(DebugTypeEnum.HANDLER, LogLevel.TWO, "~~startShuffling:", {
      gameDataIsShuffling: state.gameData.isShuffling,
      gameDataShuffleRounds: state.gameData.shuffleRounds,
      gameDataIsLoading: state.gameData.isLoading,
      interfaceSettingsSettingsModalIsShowing:
        state.interfaceSettings.settingsModal.isShowing,
    });
  });

  const stopShuffling = $(function () {
    state.gameData.isShuffling = false;
    readyGame();

    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "stopShuffling:", {
      gameDataIsShuffling: state.gameData.isShuffling,
      gameDataIsLoading: state.gameData.isLoading,
    });
  });

  const lastDeal = useSignal(Date.now()); // just for logging

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
    if (state.gameData.dealCardIndex === 0) {
      state.gameData.isDealing = false;
    }
  });

  const DEFAULT_OPTS_STOP_DEALING: StopDealingOpts = {
    willShuffle: true,
  };
  const stopDealing = $(function (opts?: Partial<StopDealingOpts>) {
    const { willShuffle } = {
      ...DEFAULT_OPTS_STOP_DEALING,
      ...opts,
    };
    logger(DebugTypeEnum.HANDLER, LogLevel.ONE, "stopDealing", {
      willShuffle,
    });
    state.gameData.isDealing = false;
    state.gameData.dealCardIndex = 0;
    if (willShuffle) {
      startShuffling();
      return;
    }
    readyGame();
  });

  const handlers: iGameHandlers = {
    dealCard,
    stopDealing,
    startDealing,
    shuffleCardPositions,
    startShuffling,
    stopShuffling,
    sliceDeck,
    calculateAndResizeBoard,
    showSettingsModal,
    hideSettingsModal,
    showEndOfGameModal,
    hideEndOfGameModal,
    showScoresModal,
    hideScoresModal,
    isEndGameConditionsMet,
    startGame,
    endGame,
    resetGame,
    toggleModal,
  };

  // hold the state, and the functions
  const service = {
    state,
    handle: handlers,
    timer,
    boardRef,
    containerRef,
  };

  // provide the service to children
  useContextProvider(GameContext, service);

  // return for immediate use
  return service;
};

// helper to use the service
export const useGameContextService = () => useContext<GameService>(GameContext);
