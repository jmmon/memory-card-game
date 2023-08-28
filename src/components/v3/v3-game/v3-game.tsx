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
import { shuffleCardPositions, FULL_DECK_COUNT } from "../utils/v3CardUtils";
import SettingsModal from "../settings-modal/settings-modal";
// import LoadingModal from "../loading-modal/loading-modal";
import GameHeader from "../game-header/game-header";
import { isServer } from "@builder.io/qwik/build";
import { formattedDeck } from "../utils/cards";
// import GameEndModal from "../game-end-modal/game-end-modal";
// import { useDeck } from "~/routes/v3/index";
// import InverseModal from "../inverse-modal/inverse-modal";

// const deckCardsApi = "https://deckofcardsapi.com/api/deck/new/";

export const DEFAULT_CARD_COUNT = 18;

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
    winModal: {
      isShowing: boolean;
    };
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
    gameEndModal: {
      isShowing: boolean;
    };
  };
  // generateDeck: QRL<() => void>;
  shuffleCardPositions: QRL<() => void>;
  toggleSettingsModal: QRL<() => void>;
  // shuffleCardPositionsWithTransition: QRL<() => void>;
  //
  sliceDeck: QRL<() => V3Card[]>;
  resetGame: QRL<() => void>;
};

const INITIAL = {
  boardLayout: {
    width: 992,
    height: 559,
    area: 992 * 559,
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
    cards: [],
    mismatchPairs: [],
    isLoading: true,
    isShuffling: false,
    isShufflingDelayed: false,
    winModal: {
      isShowing: false,
    },
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
      isLocked: false,
      minimumCards: 6,
      maximumCards: 52,
      fullDeck: [],
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
    gameEndModal: {
      isShowing: false,
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
    const start =
      Math.floor(
        (Math.random() * (FULL_DECK_COUNT - this.settings.deck.size)) / 2
      ) * 2;

    const cards = this.settings.deck.fullDeck.slice(
      start,
      start + this.settings.deck.size
    );

    this.game.cards = cards;
    return cards;
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
  const appStore = useStore<AppStore>({ ...INITIAL }, { deep: true });
  useContextProvider(AppContext, appStore);
  const containerRef = useSignal<HTMLElement>();

  // const deck = useDeck();
  //
  // useTask$(async () => {
  //   console.log("visibleTask fetched deck:", {
  //     deck: deck.value.deck,
  //     type: deck.value.type,
  //   });
  //   appStore.settings.deck.fullDeck = deck.value.deck;
  //
  //   // get a random start, make sure to halve so we count pairs
  //   const start = Math.floor(
  //     (Math.random() * (FULL_DECK_COUNT - appStore.settings.deck.size)) / 2
  //   );
  //   appStore.game.cards = deck.value.deck.slice(
  //     start * 2,
  //     start * 2 + appStore.settings.deck.size
  //   );
  //   appStore.game.isLoading = false;
  // });

  // useTask$(async () => {
  //   console.log("loading");
  //   const origin = import.meta.env.DEV
  //     ? "http://localhost:5173/"
  //     : "https://joemoulton.dev/";
  //   console.log({ origin });
  //
  //   try {
  //     const response = await fetch(`${origin}api/deck`);
  //     const { deck, type } = (await response.json()) as {
  //       deck: V3Card[];
  //       type: "v3" | "api";
  //     };
  //
  //     console.log("visibleTask fetched deck:", {
  //       // deck: deck,
  //       type: type,
  //     });
  //     appStore.settings.deck.fullDeck = deck;
  //
  //     // get a random start, make sure to halve so we count pairs
  //     appStore.sliceDeck();
  //
  //   } catch (err) {
  //     console.log({ err });
  //   } finally {
  //     console.log("done loading");
  //     appStore.game.isLoading = false;
  //   }
  // });
  //

  useTask$(() => {
    appStore.settings.deck.fullDeck = formattedDeck;
    appStore.sliceDeck();
  });

  return (
    <>
      <div
        ref={containerRef}
        class={`flex flex-col  flex-grow justify-between w-full h-full p-[1.5%] gap-1 ${
          appStore.boardLayout.isLocked ? "overflow-x-auto" : ""
        }`}
      >
        <GameHeader />
        <V3Board containerRef={containerRef} />
      </div>
      {appStore.game.isLoading && (
        <div class="text-slate-200 backdrop-blur-[3px] bg-black bg-opacity-20 z-50  absolute top-0 left-0 text-4xl w-full flex-grow h-full flex justify-center items-center">
          Loading...
        </div>
      )}
      <SettingsModal />
    </>
  );
});

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
 *
 *
 * Settings:
 * - "Apply/Save" button and "Cancel" button??
 *
 * Game End Modal:
 * - shows when appStore.game.isOver (or getter function to check status)
 *   - Message
 *   - Successful Pairs: n/maxN
 *   - Mismatched Pairs: m[/maxM]
 *   - Total Points?: 10 * n - (maxM ? m * 10 * (maxM / maxN) : 0) // if counting maxM, can factor that in to the points
 *
 * Eventually: score board??? Enter your initials or something
 *
 * Some advanced prefetch guarantee for the images? proxy the images so I can cache them??? possible??
 * */
