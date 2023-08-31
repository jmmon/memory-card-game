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
import { shuffleCardPositions, shuffleByPairs } from "../utils/v3CardUtils";
import SettingsModal  from "../settings-modal/settings-modal";
import GameHeader from "../game-header/game-header";
import { isServer } from "@builder.io/qwik/build";
import { formattedDeck } from "../utils/cards";
import GameEndModal from "../game-end-modal/game-end-modal";
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
};
export type CardLayout = {
  width: number;
  height: number;
  area: number;
  roundedCornersPx: number;
};

type GameContext = {
    isStarted: boolean;
    flippedCardId: number;
    selectedCardIds: number[];
    successfulPairs: Pair[];
    cards: V3Card[];
    mismatchPairs: Pair[];
    mismatchPair: Pair | string;
    isShaking: boolean;
    isLoading: boolean;
    isShufflingAnimation: boolean;
    isShufflingDelayed: boolean;
    time: {
      isPaused: boolean;
      timestamps: number[];
      total: number;
    };
  }
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
    () => {
      isEnded: boolean;
      isWin?: boolean;
    }
  >;
  createTimestamp: QRL<
    (opts?: Partial<{ paused?: boolean }>) => number | undefined
  >;
};

const INITIAL_GAME_STATE: GameContext = {
  isStarted: false,
  cards: [],
  mismatchPair: "",
  isShaking: false,
  flippedCardId: -1,
  selectedCardIds: [],
  successfulPairs: [],
  mismatchPairs: [],
  isLoading: true,
  isShufflingAnimation: false,
  isShufflingDelayed: false,
  time: {
    isPaused: true,
    timestamps: [],
    total: 0,
  },
};

const INITIAL_STATE: AppStore = {
  boardLayout: {
    width: 291.07,
    height: 281.81,
    area: 291.07 * 281.81,
    columns: 5,
    rows: 4,
    isLocked: false, // prevent recalculation of board layout
  },

  cardLayout: {
    width: 50.668,
    height: 70.3955,
    roundedCornersPx: 2.533,
    area: 50.668 * 70.3955,
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

  /* ================================
   * TODO:
   * integrate shuffleCounter better into the shuffle function
   * e.g. appStore.shuffleCards(count: <0-5>);
   * 0 === shuffle once without animation
   * 1-5 === shuffle n times with animation
   * ================================ */
  shuffleCardPositions: $(function (this: AppStore) {
    console.log("shuffleCardPositionsWithTransition");
    // shuffle and set new positions, save old positions
    this.game.cards = shuffleCardPositions(this.game.cards);

    // to activate animation - only when running on client
    if (isServer) return;
    this.game.isLoading = true;
    this.interface.settingsModal.isShowing = false;
    this.game.isShufflingAnimation = true;
  }),

  sliceDeck: $(function (this: AppStore) {
    const deckShuffledByPairs = shuffleByPairs([
      ...this.settings.deck.fullDeck,
    ]);

    this.game.cards = deckShuffledByPairs.slice(0, this.settings.deck.size);
  }),

  resetGame: $(function (this: AppStore, settings?: Partial<AppSettings>) {
    if (settings) {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }
    this.game = INITIAL_GAME_STATE;
    this.sliceDeck();
  }),

  isGameEnded: $(function (this: AppStore) {
    // TODO:
    // implement other modes, like max mismatches
    const isEnded =
      this.game.successfulPairs.length === this.settings.deck.size / 2;
    const isWin =
      this.game.successfulPairs.length === this.settings.deck.size / 2;
    return { isEnded, isWin };
  }),

  createTimestamp: $(function (
    this: AppStore,
    opts?: Partial<{ paused?: boolean }>
  ) {
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
  console.log("game render count");
  // set up context
  const appStore = useStore({ ...INITIAL_STATE }, { deep: true });
  useContextProvider(AppContext, appStore);
  const containerRef = useSignal<HTMLElement>();

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

      console.log("running updateTime:", {
        time: appStore.game.time.total,
        accum,
        isPaused,
        now,
      });
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
 *
 *
 *
 *   ALTERNATE CARD POSITIONING:
 * - use positions (top, left) and be relative to the Board component
 * - set the top left corners
 * - Then, when shuffling, simply adjust the top and left of each card
 * - the transtions on top & left will handle the rest!!!
 *
 * - Should be able to reuse coordinates
 * - just need to set top & left instead of setting gridRow & gridCol
 * - then can simplify the shuffling method
 *
 *
 * - other ideas for card positioning??
 *   - run shuffle over time, card after card, so animation is one at a time
 *   - e.g. chain them: c[5] => c[1], c[1] => c[7], c[7] => c[n]
 *
 * - Transform-translate EVERYTHING:
 *   - no need for grid
 *   - each card would be absolute top left
 *   - translate into each spot (based on coords/position)
 *   - When a card needs to move to a new position, just find the difference between the old and the new and apply it!
 *
 *
 *
 *
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
