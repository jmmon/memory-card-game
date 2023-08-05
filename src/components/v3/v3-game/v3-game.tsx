import { component$, useContextProvider, useStore } from "@builder.io/qwik";
import V3Board from "../v3-board/v3-board";
import { AppContext } from "../v3-context/v3.context";
import { v3GenerateCards } from "../utils/v3CardUtils";

export type AppStore = {
  flippedCardId: number;
  selectedCardIds: number[];
  successfulPairs: `${number}:${number}`[];
  cards: V3Card[];
  settings: {
    CARD_FLIP_ANIMATION_DURATION: number;
    columnCount: number;  // default 6, should dynamically adjust
    cardCount: number;
  };
}

// MIN_MAX_COLUMNS_OFFSET == computed, MIN_MAX_ROWS_OFFSET == computed, getXYFromPosition, isCardRemoved 
export type V3Card = {
  id: number; // unique id
  text: string; // content of the card
  position: number; // where it lands in the order of slots on the board
  pairId: number;
}

const DEFAULT_CARD_COUNT = 18;

export default component$(() => {
// set up context
  const appStore = useStore<AppStore>({
    flippedCardId: -1,
    selectedCardIds: [],
    successfulPairs: [],
    cards: v3GenerateCards(DEFAULT_CARD_COUNT),

    settings: {
      CARD_FLIP_ANIMATION_DURATION: 800,
      columnCount: 6,
      cardCount: DEFAULT_CARD_COUNT,
    },
  });

  useContextProvider(AppContext, appStore);
  return (
    <div class="w-full h-full flex flex-col items-center">
      <GameHeader />
      <V3Board />
{/* maybe have the modal here */}
    </div>
  );
});

const GameHeader = component$(() => {
  return (
    <header class="text-center">This is the game header with some score stuff and the title</header>
  );
});
