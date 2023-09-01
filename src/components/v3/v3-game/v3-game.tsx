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
  endGame: QRL<(isWin: boolean) => void>;
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
  state: GAME_STATES.WAITING,
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

const INITIAL_STATE: AppStore = {
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
    this.game.isStarted = true;
    this.game.state = GAME_STATES.PLAYING;
    this.createTimestamp({ paused: false });
  }),
  endGame: $(function (this: AppStore, isWin: boolean) {
    // should run when game is ended, to hault timer permanently
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
    this.game.time.isPaused = true; // needed?

    this.game.isStarted = false; // needed?
    this.game.state = GAME_STATES.ENDED;
  }),
};

const calculateAccumTimeFromTimestampsArr = (timestamps: number[]) => {
  // even indices are start
  let accum = 0;
  let start = 0;
  for (let i = 0; i < timestamps.length; i++) {
    const isStart = i % 2 === 0;

    if (isStart) {
      start = timestamps[i];
    } else {
      accum += timestamps[i] - start;
      start = 0;
    }
  }
  if (start !== 0) {
    // we know the timer is unpaused
    // so we have accum time, then need to count from there
  }
  return { isPaused: start === 0, accum };
};

export default component$(() => {
  console.log("game render");
  // set up context
  const appStore = useStore({ ...INITIAL_STATE }, { deep: true });
  useContextProvider(AppContext, appStore);
  const containerRef = useSignal<HTMLElement>();

  /* ============================
   * Handle game timer calculation and pausing
   * ============================ */
  useVisibleTask$((taskCtx) => {
    const isPaused = taskCtx.track(() => appStore.game.time.isPaused);

    const updateTime = () => {
      const now = Date.now();
      const { isPaused, accum } = calculateAccumTimeFromTimestampsArr(
        appStore.game.time.timestamps
      );
      if (isPaused) {
        appStore.game.time.total = accum;
      } else {
        appStore.game.time.total =
          accum + (now - (appStore.game.time.timestamps.at(-1) as number));
      }

      // console.log("running updateTime:", {
      //   time: appStore.game.time.total,
      //   accum,
      //   isPaused,
      //   now,
      // });
    };

    updateTime(); // update whenever isPaused changes

    if (isPaused) {
      return;
    }

    const timer = setInterval(updateTime, 100);
    taskCtx.cleanup(() => clearInterval(timer));
  });

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
            appStore.interface.settingsModal.isShowing = true;
            appStore.createTimestamp({ paused: true });
            console.log("header - showing settings");
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
 * Some way to initialize dummy cards and fill in with actual data later?
 * That way I can do initial shuffle as the api is responding? then swap them out
 * Will need to have a loading indicator in case the fetch takes a long time
 * BETTER:
 * "loading" animation is simply the cards shuffling repeatedly!
 * after loaded from API, (shuffle the cards, or map them to the shuffled dummy ids, and then) swap the cards out
 *
 *  BEST:
 *  use hardcoded cards!!! then only need to load while shuffling
 *
 *
 *
 * Settings:
 * - "Cancel" button??
 *
 *
 *
 * Points system
 *   - Total Points?: 10 * n - (maxM ? m * 10 * (maxM / maxN) : 0) // if counting maxM, can factor that in to the points
 *
 *
 *
 * Eventually: score board??? Enter your initials or something
 *
 *
 *
 *
 * Some advanced prefetch guarantee for the images? proxy the images so I can cache them??? possible??
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
