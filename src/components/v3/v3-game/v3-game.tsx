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
  shufflingState: number;
};
export type AppStore = {
  boardLayout: BoardLayout;
  cardLayout: CardLayout;

  game: GameContext;

  settings: AppSettings;

  interface: {
    successAnimation: boolean;
    mismatchAnimation: boolean;
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
    if (this.timer.state.isStarted) {
      this.timer.reset();
    }
    this.timer.start();
  }),
  showSettings: $(function (this: AppStore) {
    this.timer.pause();
    this.interface.settingsModal.isShowing = true;
  }),
  hideSettings: $(function (this: AppStore) {
    this.interface.settingsModal.isShowing = false;
    this.timer.resume();
  }),
  endGame: $(function (this: AppStore, isWin: boolean) {
    this.timer.stop();
    this.interface.endOfGameModal.isWin = isWin;
    this.interface.endOfGameModal.isShowing = true;
  }),
};

export default component$(() => {
  const timer = useTimer();
  console.log("game render");
  // set up context
  const gameContext = useStore<AppStore>(
    {
      ...INITIAL_STATE,
      timer: timer,
    },
    { deep: true }
  );
  useContextProvider(AppContext, gameContext);
  const containerRef = useSignal<HTMLElement>();

  useVisibleTask$(({ track }) => {
    track(() => [
      gameContext.timer.state.isPaused,
      gameContext.timer.state.isStarted,
    ]);
    console.log({
      isStarted: gameContext.timer.state.isStarted,
      isPaused: gameContext.timer.state.isPaused,
    });
  });

  /* ============================
   * pause game when switching tabs
   * - set up listeners
   * ============================ */
  useVisibleTask$(({ cleanup }) => {
    console.log("setup visibilitychange listener");
    let hidden = "hidden";
    let state = 0;

    // Standards:
    if (hidden in document) {
      document.addEventListener("visibilitychange", onchange);
      state = 1;
    } else if ((hidden = "mozHidden") in document) {
      document.addEventListener("mozvisibilitychange", onchange);
      state = 2;
    } else if ((hidden = "webkitHidden") in document) {
      document.addEventListener("webkitvisibilitychange", onchange);
      state = 3;
    } else if ((hidden = "msHidden") in document) {
      document.addEventListener("msvisibilitychange", onchange);
      state = 4;
    }
    // IE 9 and lower:
    else if ("onfocusin" in document) {
      (document as Document & { onfocusin: any; onfocusout: any }).onfocusin = (
        document as Document & { onfocusin: any; onfocusout: any }
      ).onfocusout = onchange;
      state = 5;
    }
    // All others:
    else {
      window.onpageshow =
        window.onpagehide =
        window.onfocus =
        window.onblur =
          onchange;
    }

    function onchange(evt: any) {
      console.log("onchange runs", { evt });
      const v = "visible",
        h = "hidden",
        evtMap: { [key: string]: string } = {
          focus: v,
          focusin: v,
          pageshow: v,
          blur: h,
          focusout: h,
          pagehide: h,
        };

      evt = evt || window.event;
      if (evt.type in evtMap) {
        document.body.dataset["visibilitychange"] = evtMap[evt.type];
      } else {
        // @ts-ignore
        document.body.dataset["visibilitychange"] = this[hidden]
          ? "hidden"
          : "visible";
      }

      if (document.body.dataset["visibilitychange"] === "hidden") {
        gameContext.showSettings();
      }
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if ((document as Document & { [key: string]: any })[hidden] !== undefined) {
      onchange({
        type: (document as Document & { [key: string]: any })[hidden]
          ? "blur"
          : "focus",
      });
    }

    cleanup(() => {
      console.log("cleanup visibilitychange listener");
      if (state === 1) {
        document.removeEventListener("visibilitychange", onchange);
      } else if (state === 2) {
        document.removeEventListener("mozvisibilitychange", onchange);
      } else if (state === 3) {
        document.removeEventListener("webkitvisibilitychange", onchange);
      } else if (state === 4) {
        document.removeEventListener("msvisibilitychange", onchange);
      } else if (state === 5) {
        (document as Document & { onfocusin: any }).onfocusin = (
          document as Document & { onfocusout: any }
        ).onfocusout = null;
      } else if (state === 0) {
        window.onpageshow =
          window.onpagehide =
          window.onfocus =
          window.onblur =
            null;
      }
    });
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
          gameContext.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
        ref={containerRef}
      >
        <GameHeader
          showSettings$={() => {
            gameContext.showSettings();
          }}
        />
        <V3Board containerRef={containerRef} />
      </div>

      <LoadingPage isShowing={gameContext.game.isLoading} />
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
 * instead just give people a score of x percentile of mismatches and y percentile of time
 * - separate scoreboard per pairs count, and can rate games by time and by mismatches
 *
 *
 * Eventually: score board??? Enter your initials or something
 *
 *
 *
 * Query params to initialize game with certain settings? would be epic!
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
 *
 *
 *
 * maybe use sql?
 * scoreModel: {
 *   createdAt: Date,
 *   time: number,
 *   deckSize: number,
 *   mismatches: number,
 *   userId: string
 * }
 *
 * submitWin(data): submits the win and calculates and returns your percentile scores
 *
 * getCategory(deckSize): returns list of scores matching deck size
 * getAllScores(): returns all scores
 *
 * unique user id for saving the score
 * - ask to store in localStorage or cookie
 * - user can type in initials (3 characters, or maybe more?) 8? 12? 16?
 *
 *
*
*
* disable mismatch score animation, except if using special modes (not yet implemented)
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
