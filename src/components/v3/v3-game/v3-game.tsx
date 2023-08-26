import type { QRL } from "@builder.io/qwik";
import {
  $,
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
} from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import { shuffleCardPositions, v3GenerateCards } from "../utils/v3CardUtils";
import SettingsModal from "../settings-modal/settings-modal";
// import LoadingModal from "../loading-modal/loading-modal";
import GameHeader from "../game-header/game-header";
import { isServer } from "@builder.io/qwik/build";
// import InverseModal from "../inverse-modal/inverse-modal";

// const deckCardsApi = "https://deckofcardsapi.com/api/deck/new/";

const DEFAULT_CARD_COUNT = 18;

export type Pair = `${number}:${number}`;
//
// MIN_MAX_COLUMNS_OFFSET == computed, MIN_MAX_ROWS_OFFSET == computed, getXYFromPosition, isCardRemoved
export type V3Card = {
  id: number; // unique id
  text: string; // content of the card
  position: number; // where it lands in the order of slots on the board
  prevPosition: number | null; // null normally; number when shuffling to new position
  pairId: number;
  isMismatched: boolean;
  image?: string;
};

export type AppStore = {
  boardLayout: {
    width: number;
    height: number;
    area: number;
    rows: number;
    columns: number;
    isLocked: boolean;
  };

  cardLayout: {
    width: number;
    height: number;
    roundedCornersPx: number;
    area: number;
  };

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
    columnCount: number; // default 6, should dynamically adjust
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
    };
    modal: {
      isShowing: boolean;
    };
    interface: {
      showSelectedIds: boolean;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  toggleSettingsModal: QRL<() => void>;
  // shuffleCardPositionsWithTransition: QRL<() => void>;
};

const INITIAL = {
  // TODO (after settings is DONE):
  // - get settings for ~1280px * 720px window for use as default
  boardLayout: {
    width: 992,
    height: 559,
    area: 554528,
    rows: 3,
    columns: 7,
    isLocked: false, // prevent recalculation of board layout
  },

  cardLayout: {
    width: 119.7857142857143,
    height: 186.33333333333334,
    roundedCornersPx: 12,
    area: 22320.071428571435,
  },

  game: {
    flippedCardId: -1,
    selectedCardIds: [],
    successfulPairs: [],
    cards: v3GenerateCards(DEFAULT_CARD_COUNT),
    mismatchPairs: [],
    isLoading: true,
    isShuffling: false,
    isShufflingDelayed: false,
  },

  settings: {
    cardFlipAnimationDuration: 800,
    columnCount: 6,
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

    resizeBoard: false,

    deck: {
      size: DEFAULT_CARD_COUNT,
      isLocked: false,
      minimumCards: 2,
      maximumCards: 52,
    },
    modal: { isShowing: false },

    interface: {
      showSelectedIds: false,
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
    this.game.isShuffling = true;
  }),

  toggleSettingsModal: $(function (this: AppStore) {
    this.settings.modal.isShowing = !this.settings.modal.isShowing;
  }),
};

export default component$(() => {
  // set up context
  const appStore = useStore<AppStore>({ ...INITIAL }, { deep: true });
  const containerRef = useSignal<HTMLElement>();

  useContextProvider(AppContext, appStore);

  useTask$((taskCtx) => {
    taskCtx.track(() => containerRef.value?.offsetHeight);
    if (isServer) return;

    console.log(
      "detecting offsetHeight change:",
      containerRef.value?.offsetHeight
    );
  });

  return (
    <>
      {/* <InverseModal > grid grid-rows-[2.5em_1fr]   */}
      <div
        ref={containerRef}
        class={`flex flex-col flex-grow w-full h-full p-[1.5%]   gap-1 ${
          appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
      >
        <GameHeader />
        <V3Board containerRef={containerRef} />
      </div>
      <SettingsModal />
      {/* <LoadingModal /> */}
      {/* </InverseModal > */}
    </>
  );
});
