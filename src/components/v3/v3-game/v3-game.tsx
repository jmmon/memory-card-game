import type { QRL } from "@builder.io/qwik";
import {
  $,
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import {
  shuffleCardPositions,
  FULL_DECK_COUNT,
  shuffleByPairs,
} from "../utils/v3CardUtils";
import SettingsModal from "../settings-modal/settings-modal";
// import LoadingModal from "../loading-modal/loading-modal";
import GameHeader from "../game-header/game-header";
import { isServer } from "@builder.io/qwik/build";
import { formattedDeck } from "../utils/cards";
// import GameEndModal from "../game-end-modal/game-end-modal";
// import { useDeck } from "~/routes/v3/index";
// import InverseModal from "../inverse-modal/inverse-modal";

export const DEFAULT_CARD_COUNT = 18;

export type Pair = `${number}:${number}`;
//
export type V3Card = {
  id: number;
  text: string; // alternate content of the card (if no img)
  position: number; // board slot index
  prevPosition: number | null; // used for shuffle transition calculations
  pairId: number; // id of paired card
  /* isMismatched:  might not need ??
   * could move this logic to the board:
   *   - could move shake timer into board as well, instead of one timer per card
   * 1. after mismatch, save game.mismatchedPair
   *   - then the cards know which ones to shake.
   * 3. After shake is done it should be cleared
   * */
  isMismatched: boolean;
  image?: string;
localSVG?: string;
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

export type AppStore = {
  boardLayout: BoardLayout;
  cardLayout: CardLayout;
  game: {
    flippedCardId: number;
    selectedCardIds: number[];
    successfulPairs: Pair[];
    cards: V3Card[];
    mismatchPairs: Pair[];
    isLoading: boolean;
    isShuffling: boolean;
    isShufflingDelayed: boolean;
  };

  settings: {
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
      minimumCards: number;
      maximumCards: number;
      fullDeck: V3Card[];
    };
    modal: {
      isShowing: boolean;
    };
    interface: {
      showSelectedIds: boolean;
      showDimensions: boolean;
    };
  };

  interface: {
    settingsModal: {
      isShowing: boolean;
    };
    endOfGameModal: {
      isShowing: boolean;
      isWin: boolean;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  toggleSettingsModal: QRL<() => void>;
  sliceDeck: QRL<() => void>;
  resetGame: QRL<() => void>;
};

const INITIAL_STATE = {
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

  game: {
    flippedCardId: -1,
    selectedCardIds: [],
    successfulPairs: [],
    cards: [],
    mismatchPairs: [],
    isLoading: true,
    isShuffling: false,
    isShufflingDelayed: false,
  },

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
      isLocked: true,
      minimumCards: 6,
      maximumCards: 52,
      fullDeck: formattedDeck,
    },

    modal: { isShowing: false },

    interface: {
      showSelectedIds: false,
      showDimensions: false,
    },
  },
  interface: {
    settingsModal: {
      isShowing: false,
    },
    endOfGameModal: {
      isShowing: false,
      isWin: false,
    },
  },

  shuffleCardPositions: $(function (this: AppStore) {
    console.log("shuffleCardPositionsWithTransition");
    const cards = this.game.cards;
    // shuffle and set new positions, save old positions
    const shuffled = shuffleCardPositions(cards);
    console.log({ cards, shuffled });

    this.game.cards = shuffled;

    // to activate animation - only when running on client
    if (isServer) return;
    this.settings.modal.isShowing = false;
    this.game.isLoading = true;
    this.game.isShuffling = true;
  }),

  toggleSettingsModal: $(function (this: AppStore) {
    this.settings.modal.isShowing = !this.settings.modal.isShowing;
  }),

  sliceDeck: $(function (this: AppStore) {
    const deckShuffledByPairs = shuffleByPairs([
      ...this.settings.deck.fullDeck,
    ]);

    const cards = deckShuffledByPairs.slice(0, this.settings.deck.size);

    this.game.cards = cards;
    console.log("playing deck:", { cards });
  }),

  resetGame: $(function (this: AppStore) {
    this.game = {
      ...this.game,
      flippedCardId: -1,
      selectedCardIds: [],
      successfulPairs: [],
      cards: [],
      mismatchPairs: [],
      isLoading: true,
      isShuffling: false,
      isShufflingDelayed: false,
    };
    this.sliceDeck();
  }),
};

// export const serverFetchDeck = server$(fetchAndFormatDeck);

export default component$(() => {
  console.log("game render count");
  // set up context
  const appStore = useStore<AppStore>({ ...INITIAL_STATE }, { deep: true });
  useContextProvider(AppContext, appStore);
  const containerRef = useSignal<HTMLElement>();

  return (
    <>
      <div
        class={`flex flex-col flex-grow justify-between w-full h-full p-[1.5%] gap-1 ${
          appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
        ref={containerRef}
      >
        <GameHeader />
        <V3Board containerRef={containerRef} />
      </div>
      {appStore.game.isLoading && <LoadingPage />}
      <SettingsModal />
    </>
  );
});

const LoadingPage = ({ blur = true }: { blur?: boolean }) => (
  <div
    class={` text-slate-200 ${
      blur ? "backdrop-blur-[2px]" : ""
    } bg-black bg-opacity-20 z-50  absolute top-0 left-0 text-4xl w-full flex-grow h-full flex justify-center items-center `}
  >
    Loading...
  </div>
);

/*
 *
 * TODO:
 *
 * Some way to initialize dummy cards and fill in with actual data later?
 * That way I can do initial shuffle as the api is responding? then swap them out
 * Will need to have a loading indicator in case the fetch takes a long time
 *
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
 * - "Apply/Save" button and "Cancel" button??
 *
*
*
 * Game End Modal:
 * - shows when appStore.game.isOver (or getter function to check status)
 *   - Message
 *   - Successful Pairs: n/maxN
 *   - Mismatched Pairs: m[/maxM]
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
* "par" ratings depending on pairs count? e.g. fibb sequence or something to ramp up
* Or better yet, scores per pairs count, and can rate games by time and by mismatches
 * */
