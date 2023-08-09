import {
  $,
  QRL,
  component$,
  useContextProvider,
  useSignal,
  useStore,
} from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import { shuffleCardPositions, v3GenerateCards } from "../utils/v3CardUtils";
import SettingsModal from "../settings-modal/settings-modal";
import LoadingModal from "../loading-modal/loading-modal";
import GameHeader from "../game-header/game-header";

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

    deck: {
      size: number;
      isLocked: boolean;
      minimumCards: number;
      maximumCards: number;
    };
    modal: {
      isShowing: boolean;
    };
  };
  shuffleCardPositions: QRL<() => void>;
  toggleModal: QRL<() => void>;
  shuffleCardPositionsWithTransition: QRL<() => void>;
  isShufflingCards: boolean;
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

    deck: {
      size: DEFAULT_CARD_COUNT,
      isLocked: false,
      minimumCards: 2,
      maximumCards: 52,
    },
    modal: { isShowing: false },
  },

  shuffleCardPositions: $(function (this: AppStore) {
    const cards = this.game.cards;
    // shuffle and set new positions, save old positions
    const shuffled = shuffleCardPositions(this.game.cards);
    console.log({ cards, shuffled });
    this.game.cards = shuffled;
  }),

  toggleSettingsModal: $(function (this: AppStore) {
    this.settings.modal.isShowing = !this.settings.modal.isShowing;
  }),

  // TODO:
  // - Implement the below settings
  // - implement shuffling with transitions:
  //   - take old positions, get new positions, generate transition path for each card
  //   - apply transition (each card)
  //   - afterwards, swap the card positions to the new positions
  // or inverse: 
  //   - swap card positions but transition back to previous positions;
  //   - then revert over duration to slide into new position
  isShufflingCards: false,
  shuffleCardPositionsWithTransition: $(function (this: AppStore) {
// mark game as isShuffling
    this.isShufflingCards = true;
    console.log("shuffleCardPositionsWithTransition");

    const cards = this.game.cards;
    const oldPositions = cards.map((each) => each.position);

    // shuffle and set new positions, save old positions
    const shuffled = shuffleCardPositions(this.game.cards);
    const newPositions = shuffled.map((each) => each.position);
// can then apply translations immediately and then revert back to the new positions
    console.log({ cards, shuffled });
    this.game.cards = shuffled;
  }),
};

export default component$(() => {
  // set up context
  const appStore = useStore<AppStore>({ ...INITIAL }, { deep: true });
  const containerRef = useSignal<HTMLDivElement>();

  useContextProvider(AppContext, appStore);

  return (
    <>
      <div
        class={`w-full max-h-full h-full p-4 grid ${
          appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
        style="grid-template-rows: 12% 88%;"
        ref={containerRef}
      >
        <GameHeader />
        <V3Board />
      </div>
      <SettingsModal />
      {/* <LoadingModal /> */}
    </>
  );
});
