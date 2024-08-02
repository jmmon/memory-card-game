// flow:
// click on a card, it flips and enlarges to cover center of screen
// (Now one card is "selected," added to the selected array)
// click again, on or off the card, to unflip the previous card.
//
// Next, click another card. It flips and enlarges to cover center of screen.
// (Now one card is "selected," added to the selected array)
// if this card matches the previous, set a timeout for ~1 second
// after that time, display some sort of "Matched!" message which hides after 3 seconds.
// click again (on or off the card) and it unflips,
// then the two cards hide/remove, and are added to the pairs
// finally, remove them from selected array

// For now, want to be able to
// 1. click card (flips, enlarges and centers)
// 2. click again, card or no (unflip card, shrink back to where it goes)
//
// So we need the Board to store which card is currently selected, and it becomes un-selected once it is back face-down.
// Later, it should also have selectedIds<string[]> for picking the pairs of cards

// Handling Clicks:
//
// can use one click listener on the parent element (the board)
//
// if card is flipped, unflip it
// else, if click landed on a card, flip it
//
// board has to hold the flip state
// should hold the id of the currently flipped card (if any)
//

import type {
  QwikMouseEvent} from "@builder.io/qwik";
import {
  $,
  Slot,
  component$,
  useContext,
  useOnWindow,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { Card} from "~/old/utils/cardUtils";
import { generateCards, shuffle_FY_algo } from "~/old/utils/cardUtils";
import { FlippableCard } from "~/old/v2/components/FlippableCard";
import { MatchModalContext } from "~/old/v2/context/match-modal.context";

export const CARD_FLIP_ANIMATION_DURATION = 800;
export const CARD_FLIP_ANIMATION_DURATION_HALF = CARD_FLIP_ANIMATION_DURATION / 2;

// these could be changeable in settings
export const TOTAL_CARDS = 18;
export const COLUMN_COUNT = 6; // TODO: make this dynamic!!

export const ROW_COUNT = Math.ceil(TOTAL_CARDS / COLUMN_COUNT); // TODO: make this dynamic!

// should only depend on columns
export const MIN_MAX_COLUMNS_OFFSET = (COLUMN_COUNT - 1) / 2; // 6 => 2.5, 8 => 3.5// TODO: make this dynamic!
export const MIN_MAX_ROWS_OFFSET = (ROW_COUNT - 1) / 2;// TODO: make this dynamic!
// same as (columns / 2) - 0.5

export const getXYFromPosition = (
  position: number,
  columnCount: number = COLUMN_COUNT // TODO: comes from DYNAMIC columns!
) => ({
  // 23 % 6 = 5; 16 % 6 = 4;
  x: position % columnCount,
  // 23 / 6 = 3.; 16 / 6 = 2.;
  y: Math.floor(position / columnCount),
});

// set up cards
const unshuffledCards = generateCards(TOTAL_CARDS);
const cards = shuffle_FY_algo(unshuffledCards);
// console.log({ unshuffledCards, cards });

const windowDimensionsColor = "text-slate-400";

export const GreySpan = component$(({ title }: { title: string }) => (
  <code class={`bg-black`}>
    <span class={` mr-2 ${windowDimensionsColor} `}>{title}</span>
    <Slot />
  </code>
));

export const checkMatch = (
  cardA: Card | undefined,
  cardB: Card | undefined
): boolean => {
  if (cardA === undefined || cardB === undefined) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
};

export const findCardById = (id: number) =>
  cards.find((card) => card.id === String(id));

export const buildSetFromPairs = (pairs: `${number}:${number}`[]) => {
  const set = new Set<number>();
  pairs.forEach((pair) => {
    const [c1, c2] = pair.split(":");
    set.add(Number(c1));
    set.add(Number(c2));
  });
  return set;
};

// find cardId inside pairs
export const isCardRemoved = (
  pairs: `${number}:${number}`[],
  cardId: number
) => {
  const removedCards = buildSetFromPairs(pairs);
  // console.log({
  //   pairs: pairs,
  //   pairsLen: pairs.length,
  //   removedCards: Object.fromEntries(removedCards.entries()),
  //   removedLen: removedCards.size,
  //   isRemoved: removedCards.has(cardId),
  // });
  return removedCards.has(cardId);
};

export default component$(() => {
  const gapPx = 12;
  const successfulPairs = useSignal<`${number}:${number}`[]>([]);
  const boardRef = useSignal<HTMLElement>();
  const isLoading = useSignal<boolean>(true);
  const flippedCardId = useSignal<number>(-1); // -1 is "no card being viewed"
  const selectedCards = useSignal<number[]>([]);
  const mismatchCount = useSignal<number>(0);

  const boardDimensions = useSignal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const gridSlotDimensions = useSignal<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const MatchModalStore = useContext(MatchModalContext);

  /* flippedCardId:
   *  - saves the id of the card being viewed
   *  - if -1, no card is viewed
   *  - pass this into cards
   * */

  /* selectedCards:
   *  - arr of card ids, holds up to 2
   * */

  const handleAddToSuccessfulPairsIfMatching = $(
    (cardId1: number, cardId2: number) => {
      // run checkMatch
      const card1 = findCardById(cardId1);
      const card2 = findCardById(cardId2);
      const isMatch = checkMatch(card1, card2);

      // console.log({ isMatch, card1, card2 });

      if (!isMatch) {
        mismatchCount.value++;
        return;
      }

      // add to our pairs
      successfulPairs.value = [
        ...successfulPairs.value,
        `${cardId1}:${cardId2}`,
      ];

      MatchModalStore.modal = {
        isShowing: true,
        text: `MATCH! ${JSON.stringify(card1, null, 2)} and ${JSON.stringify(
          card2,
          null,
          2
        )}`,
      };
    }
  );

  const handleSelectCard = $((id: number) => {
    // if no cards are selected, push the card id
    if (selectedCards.value.length === 0) {
      selectedCards.value = [id];
      console.log("no cards yet, adding to our array:", selectedCards.value);
      return;
    }

    // if one card is selected: {
    //   if it's the same card, do nothing
    //   else: push the card id
    // }
    if (selectedCards.value.length === 1) {
      if (id === selectedCards.value[0]) {
        console.log("same one clicked.. doing nothing", selectedCards.value);
        return;
      } else {
        selectedCards.value = [...selectedCards.value, id];
        console.log("adding second card:", selectedCards.value);
      }
    }

    const [card1, card2] = selectedCards.value;

    handleAddToSuccessfulPairsIfMatching(card1, card2);

    // finally clear our selectedCards
    selectedCards.value = [];
  });

  const handleClick = $((e: QwikMouseEvent) => {
    // console.log("clicked board:", { event: e, target: e.target });
    const isCardFlipped = flippedCardId.value !== -1;

    // handle unflip the flipped card
    if (isCardFlipped) {
      flippedCardId.value = -1;
      return;
    }

    // else get the id and save it as our flipped card
    const dataId = Number((e.target as HTMLElement).dataset.id);
    // console.log({ dataId });
    if (dataId) {
      // check if it's already removed, if so we do nothing
      const isRemoved = isCardRemoved(successfulPairs.value, dataId);
      if (isRemoved) {
        return;
      }
      // else save it as our flipped card
      flippedCardId.value = dataId;
      handleSelectCard(dataId);
    }
  });

  const updateDimensions = $(() => {
    boardDimensions.value = {
      width: boardRef.value?.offsetWidth || 0, // or clientWidth for not including border
      height: boardRef.value?.offsetHeight || 0, // or clientWidth for not including border
    };

    const columnWidth =
      ((boardDimensions.value.width - gapPx * (COLUMN_COUNT - 1)) / COLUMN_COUNT) || 0;
    const rowHeight =
      ((boardDimensions.value.height - gapPx * (ROW_COUNT - 1)) / ROW_COUNT) || 0;

    gridSlotDimensions.value = {
      width: columnWidth,
      height: rowHeight,
    };
  });




  // when first hitting client, now we have dimensions, so update our state
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    updateDimensions();
    isLoading.value = false;
  });

  // whenever resizing, update our dimensions state
  useOnWindow("resize", updateDimensions);

  return (
    <div class="h-screen flex flex-col items-stretch m-4">
      <header class="grid grid-cols-5 text-center items-center">
        <small class="col-span-2 flex gap-2 justify-center">
          <GreySpan title="flippedCardId:">{flippedCardId.value}</GreySpan>
          <GreySpan title="selected:">
            {selectedCards.value[0] || "-"} : {selectedCards.value[1] || "-"}
          </GreySpan>
        </small>
        <h1 class="col-start-3 col-span-1">Flipping Cards</h1>
        <small class="col-span-2 flex gap-2 justify-center">
          <GreySpan title="pairs:">
            {successfulPairs.value.length || 0}
          </GreySpan>
          <GreySpan title="mismatchCount:">{mismatchCount.value}</GreySpan>
        </small>
      </header>

      <div
        ref={boardRef}
        class={`grid w-full h-full`}
        style={{
          gridTemplateColumns: `repeat(${COLUMN_COUNT}, 1fr)`,
          gridTemplateRows: `repeat(${Math.ceil(
            TOTAL_CARDS / COLUMN_COUNT
          )}, 1fr)`,
          gridGap: `${gapPx}px`,
        }}
        onClick$={(e: QwikMouseEvent) => handleClick(e)}
      >
        {isLoading.value && (
          <div
            class={`w-full h-full text-center col-span-${COLUMN_COUNT} row-span-${ROW_COUNT}`}
          >
            Loading...
          </div>
        )}

        {!isLoading.value &&
          cards.map((card, i) => {
            console.log({ card, cardId: card.id, i });
            // return (
            // <div>{card.id}:{card.pairId}</div>
            // );
            return (
              <FlippableCard
                key={card.id}
                card={card}
                flippedCardId={flippedCardId}
                pairs={successfulPairs}
                slotDimensions={gridSlotDimensions}
                gap={gapPx}
              />
            );
          })}
      </div>
    </div>
  );
});

