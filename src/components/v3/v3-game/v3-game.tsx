import type { QRL } from "@builder.io/qwik";
import {
  $,
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import SettingsModal from "../settings-modal/settings-modal";
import GameHeader from "../game-header/game-header";
import { formattedDeck } from "../utils/cards";
import GameEndModal from "../game-end-modal/game-end-modal";
import {
  calculateBoardDimensions,
  calculateLayouts,
} from "../utils/boardUtils";
import deckUtils from "../utils/deckUtils";
import { useTimer } from "../utils/useTimer";
// import InverseModal from "../inverse-modal/inverse-modal";

export const DEFAULT_CARD_COUNT = 18;

export const CONTAINER_PADDING_PERCENT = 1.5;

export type Pair = `${number}:${number}`;

export type V3Card = {
  id: number;
  text: string; // alternate content of the card (if no img)
  position: number; // board slot index
  prevPosition: number | null; // used for shuffle transition calculations
  pairId: number; // id of paired card
  image?: string;
  localSVG?: string;
};

export type AppSettings = {
  cardFlipAnimationDuration: number;
  maxAllowableMismatches: number;

  shuffleBoardAfterMismatches: number;
  shuffleBoardAfterPair: boolean;
  shuffleBoardAfterRound: boolean;

  shufflePickedAfterMismatch: boolean;

  reorgnanizeBoardOnPair: boolean;
  reorgnanizeBoardOnMismatch: boolean;
  resizeBoard: boolean;

  deck: {
    size: number;
    isLocked: boolean;
    MINIMUM_CARDS: number;
    MAXIMUM_CARDS: number;
    fullDeck: V3Card[];
  };
  interface: {
    showSelectedIds: boolean;
    showDimensions: boolean;
  };
};

export type BoardLayout = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  area: number;
  isLocked: boolean;
  rowHeight: number;
  colWidth: number;
};
export type CardLayout = {
  width: number;
  height: number;
  area: number;
  roundedCornersPx: number;
  colGapPercent: number;
  rowGapPercent: number;
};

type GameContext = {
  isStarted: boolean;
  state: "WAITING" | "PLAYING" | "ENDED";
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: Pair[];
  cards: V3Card[];
  mismatchPairs: Pair[];
  mismatchPair: Pair | "";
  isShaking: boolean;
  isLoading: boolean;
  time: {
    isPaused: boolean;
    timestamps: number[];
    total: number;
  };
  shufflingState: number;
};
export type AppStore = {
  boardLayout: BoardLayout;
  cardLayout: CardLayout;

  game: GameContext;

  settings: AppSettings;

  interface: {
    inverseSettingsModal: {
      isShowing: boolean;
    };
    settingsModal: {
      isShowing: boolean;
    };
    endOfGameModal: {
      isShowing: boolean;
      isWin: boolean;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  sliceDeck: QRL<() => void>;
  resetGame: QRL<(settings?: Partial<AppSettings>) => void>;
  isGameEnded: QRL<
    () =>
      | { isEnded: false }
      | {
          isEnded: true;
          isWin: boolean;
        }
  >;
  createTimestamp: QRL<
    (opts?: Partial<{ paused?: boolean }>) => number | undefined
  >;
  startShuffling: QRL<(count?: number) => void>;
  stopShuffling: QRL<() => void>;
  initializeDeck: QRL<() => void>;
  calculateAndResizeBoard: QRL<
    (boardRef: HTMLDivElement, containerRef: HTMLDivElement) => void
  >;
  startGame: QRL<() => void>;
  showSettings: QRL<() => void>;
  hideSettings: QRL<() => void>;
  endGame: QRL<(isWin: boolean) => void>;
  timer: ReturnType<typeof useTimer>;
};

export const GAME_STATES: Readonly<{
  WAITING: "WAITING";
  PLAYING: "PLAYING";
  ENDED: "ENDED";
}> = {
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
};

const INITIAL_GAME_STATE: GameContext = {
  isStarted: false,
  state: GAME_STATES.WAITING, // WAITING, PLAYING, ENDED
  cards: [],
  mismatchPair: "",
  isShaking: false,
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  time: {
    isPaused: true,
    timestamps: [],
    total: 0,
  },
  shufflingState: 0,
};

const INITIAL_STATE = {
  boardLayout: {
    width: 291.07,
    height: 281.81,
    area: 291.07 * 281.81,
    columns: 5,
    rows: 4,
    isLocked: false, // prevent recalculation of board layout
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
      size: DEFAULT_CARD_COUNT,
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

  shuffleCardPositions: $(function (this: AppStore) {
    // shuffle and set new positions, save old positions
    const newCards = deckUtils.shuffleCardPositions(this.game.cards);
    console.log("shuffleCardPositions:", { newCards });
    this.game.cards = newCards;
  }),

  startShuffling: $(function (this: AppStore, count: number = 5) {
    this.game.shufflingState = count;
    this.game.isLoading = true;
    this.interface.settingsModal.isShowing = false;
  }),

  stopShuffling: $(function (this: AppStore) {
    this.game.shufflingState = 0;
    this.game.isLoading = false;
  }),

  sliceDeck: $(function (this: AppStore) {
    const deckShuffledByPairs = deckUtils.sliceRandomPairsFromDeck([
      ...this.settings.deck.fullDeck,
    ]);
    const cards = deckShuffledByPairs.slice(0, this.settings.deck.size);
    this.game.cards = cards;
  }),

  resetGame: $(async function (
    this: AppStore,
    settings?: Partial<AppSettings>
  ) {
    if (settings) {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }
    this.game = INITIAL_GAME_STATE;
    this.timer.reset();
    this.initializeDeck();
  }),

  isGameEnded: $(function (this: AppStore) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    if (!isEnded) return { isEnded };

    const isWin =
      this.game.successfulPairs.length === this.settings.deck.size / 2;

    return { isEnded, isWin };
  }),

  createTimestamp: $(function (
    this: AppStore,
    opts?: Partial<{ paused?: boolean }>
  ) {
    if (
      this.game.state === GAME_STATES.WAITING ||
      this.game.state === GAME_STATES.ENDED
    )
      return;
    if (!this.game.isStarted) return;

    const now = Date.now();
    const wasPaused = this.game.time.isPaused;

    if (opts) {
      if (opts.paused !== wasPaused) {
        this.game.time.timestamps.push(now);
      } else {
        // replace last timestamp with new time
        this.game.time.timestamps = this.game.time.timestamps.splice(
          -1,
          1,
          now
        );
      }
    } else {
      this.game.time.timestamps.push(now);
    }

    // length === 0 when starting the game and initial paused state
    // so === 1 after first click, should unpause the timer (=== false)
    this.game.time.isPaused = this.game.time.timestamps.length % 2 === 0;
    return now;
  }),

  initializeDeck: $(async function (this: AppStore) {
    await this.sliceDeck();
    this.startShuffling();
  }),

  calculateAndResizeBoard: $(function (
    this: AppStore,
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
  startGame: $(function (this: AppStore) {
    // should run on first click, to initialize the timer
    // TODO: swap from game.isStarted to timer.state.isStarted
    // this.game.isStarted = true;
    // this.game.state = GAME_STATES.PLAYING;
    // this.createTimestamp({ paused: false });

    // NEW: using the useTimer hook!!!!:
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();
  }),
  showSettings: $(function (this: AppStore) {
    // TODO: swap from game.time.isPaused to timer.state.isPaused
    // this.game.time.isPaused = true;
    this.timer.pause();
    this.interface.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: AppStore) {
    // TODO: swap from game.time.isPaused to timer.state.isPaused
    // this.game.time.isPaused = true;
    this.interface.settingsModal.isShowing = false;
    this.timer.resume();
  }),
  endGame: $(function (this: AppStore, isWin: boolean) {
    this.timer.stop();

    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
    // this.game.time.isPaused = true; // needed?

    // this.game.isStarted = false; // needed?
    // this.game.state = GAME_STATES.ENDED;

  }),
};

// const calculateAccumTimeFromTimestampsArr = (timestamps: number[]) => {
//   // even indices are start
//   let accum = 0;
//   let start = 0;
//   for (let i = 0; i < timestamps.length; i++) {
//     const isStart = i % 2 === 0;
//
//     if (isStart) {
//       start = timestamps[i];
//     } else {
//       accum += timestamps[i] - start;
//       start = 0;
//     }
//   }
//   if (start !== 0) {
//     // we know the timer is unpaused
//     // so we have accum time, then need to count from there
//   }
//   return { isPaused: start === 0, accum };
// };
//

export default component$(() => {
  const timer = useTimer();
  console.log("game render");
  // set up context
  const appStore = useStore<AppStore>(
    {
      ...INITIAL_STATE,
      timer: timer,
    },
    { deep: true }
  );
  useContextProvider(AppContext, appStore);
  const containerRef = useSignal<HTMLElement>();

  useVisibleTask$(({ track }) => {
    track(() => [
      appStore.timer.state.isPaused,
      appStore.timer.state.isStarted,
    ]);
    console.log({
      isStarted: appStore.timer.state.isStarted,
      isPaused: appStore.timer.state.isPaused,
    });
  });
  /* TODO: rethink through timer, make sure it's designed well
   * Functionality:
   * - start, pause, (resume,) stop, reset
   * - paused when settings modal is open - watch modal isShowing
   *   - game end modal should not affect it
   *
   *   OPERATION:
   * - save timer start time
   * - when pausing, save end time, calculate session total and add to game total.
   * - when resuming, clear end time and save start time
   * - pausing: save end time, calc, add to total
   * - resuming: clear end time & save start time
   * - ending game: save end time and calc and add to total (same as pausing)
   *
   * // meh:
   * Use custom EVENTS for fun: game:start, game:pause, game:resume, game:end
   * - so need to set up the listeners, then set up the triggers
   * - startGame, endGame, pauseGame, resumeGame:
   *   - each trigger an event
   * - on startup (first visibleTask), set up listeners
   *   - startGameListener: flip boolean to true, save startTime
   *   - endGameListener: flipp boolean to false, save endTime & calculate
   *
   *
   *  STILL need to have an interval or timeout, to keep the header clock updated
   * */

  /* ============================
   * Handle game timer calculation and pausing
   * ============================ */
  // useVisibleTask$((taskCtx) => {
  //   const isPaused = taskCtx.track(() => appStore.game.time.isPaused);
  //
  //   const updateTime = () => {
  //     const now = Date.now();
  //     const { isPaused, accum } = calculateAccumTimeFromTimestampsArr(
  //       appStore.game.time.timestamps
  //     );
  //     if (isPaused) {
  //       appStore.game.time.total = accum;
  //     } else {
  //       appStore.game.time.total =
  //         accum + (now - (appStore.game.time.timestamps.at(-1) as number));
  //     }
  //
  //     // console.log("running updateTime:", {
  //     //   time: appStore.game.time.total,
  //     //   accum,
  //     //   isPaused,
  //     //   now,
  //     // });
  //   };
  //
  //   updateTime(); // update whenever isPaused changes
  //
  //   if (isPaused) {
  //     return;
  //   }
  //
  //   const timer = setInterval(updateTime, 100);
  //   taskCtx.cleanup(() => clearInterval(timer));
  // });

  return (
    <>
      {/* <InverseModal */}
      {/*   isShowing={appStore.interface.inverseSettingsModal.isShowing} */}
      {/*   hideModal$={() => { */}
      {/*     appStore.createTimestamp({paused: false}); */}
      {/*     appStore.interface.inverseSettingsModal.isShowing = false; */}
      {/*   }} */}
      {/*   title="Settings" */}
      {/* > */}
      {/*   <div */}
      {/*     q:slot="mainContent" */}
      {/*     class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONTAINER_PADDING_PERCENT}%] gap-1 ${ */}
      {/*       appStore.boardLayout.isLocked ? "overflow-x-auto" : "" */}
      {/*     }`} */}
      {/*     ref={containerRef} */}
      {/*   > */}
      {/*     <GameHeader */}
      {/*       showSettings$={() => { */}
      {/*         appStore.interface.inverseSettingsModal.isShowing = true; */}
      {/*       }} */}
      {/*     /> */}
      {/**/}
      {/*     <V3Board containerRef={containerRef} /> */}
      {/*   </div> */}
      {/*   <SettingsContent q:slot="revealedContent" /> */}
      {/* </InverseModal> */}

      <div
        class={`flex flex-col flex-grow justify-between w-full h-full p-[${CONTAINER_PADDING_PERCENT}%] gap-1 ${
          appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
        ref={containerRef}
      >
        <GameHeader
          showSettings$={() => {
            appStore.showSettings();
            // appStore.interface.settingsModal.isShowing = true;
            // appStore.createTimestamp({ paused: true });
            // console.log("header - showing settings");
          }}
        />
        <V3Board containerRef={containerRef} />
      </div>

      <LoadingPage isShowing={appStore.game.isLoading} />
      <SettingsModal />
      <GameEndModal />
    </>
  );
});

const LoadingPage = component$(
  ({ isShowing, blur = true }: { isShowing: boolean; blur?: boolean }) => (
    <>
      <div
        class={`${
          isShowing
            ? `${
                blur ? "backdrop-blur-[2px]" : ""
              } opacity-100 z-50 pointer-events-auto`
            : "z-[-1] pointer-events-none opacity-0"
        } text-slate-200 transition-all bg-black bg-opacity-20 absolute top-0 left-0 text-4xl w-full flex-grow h-full flex justify-center items-center `}
      >
        Loading...
      </div>
    </>
  )
);

/*
 *
 * TODO:
 *
 *
 * Settings:
 * - "Cancel" button?
 *
 *
 *
 * Points system - meh
 *   - Total Points?: 10 * n - (maxM ? m * 10 * (maxM / maxN) : 0) // if counting maxM, can factor that in to the points
 *
 *
 *
 * Eventually: score board??? Enter your initials or something
 *
 *
 *
 * Query params to initialize game with certain settings? would be epic!
 *
 *
 * timed missions?
 * - time starts on first click and ends on gameEndModal popup
 *   (- can rate against other players, top percentile rankings eventually)
 * - separate scoreboard per pairs count, and can rate games by time and by mismatches
 *
 *
 *
 * FIX TIMER:
 * - when completing game, close out of endGameModal, click settings
 * - expected: timer to be paused still
 * - actual: timer resumes and kinda resets
 *
 * solutions?: isGameEnded boolean which is true at the end, and is false once game is clicked
 * maybe should have endGame function and startGame function to make it easier
 * - track settingsModal.isOpen to pause the timer
 * - also track isGameEnded (or isGameStarted) to pause the timer
 *
 *
 *
 *
 *
 *
 * db: storing game data
 * - want initials of user? or actual login info??? meh
 *   - maybe there's a way to make a unique identifier for the ip / user / session / ??? otherwise might have lots of dupliate initials.
 * - want to store pairs, mismatches, deck.size, time.total, modes? (TODO)
 * - then can fetch all data and sort by deck.size
 *   - and then can compare current game with the rest (of the same deck.size) to find out how good you did vs others (percentile)
 *
 * */

/*
 *
 *  TODO: attempt to find edge case in qwik build? heh...
 *
 *  board component fetches and initializes cards, then jsx is able to render them
 *  board component is using a variable exported by card component
 *  the order of imports in the build ends up out of order for some reason
 *
 *  */
