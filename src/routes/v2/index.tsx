import {
  $,
  QwikMouseEvent,
  Signal,
  Slot,
  component$,
  useComputed$,
  useContext,
  useOnWindow,
  useSignal,
  useStylesScoped$,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { MatchModalContext } from "~/context/match-modal.context";

export const CARD_FLIP_ANIMATION_DURATION = 800;
export const CARD_FLIP_ANIMATION_DURATION_HALF =
  CARD_FLIP_ANIMATION_DURATION / 2;

export const TOTAL_CARDS = 18;
export const COLUMN_COUNT = 6;
export const ROW_COUNT = Math.ceil(TOTAL_CARDS / COLUMN_COUNT);

// should only depend on columns
export const MIN_MAX_COLUMNS_OFFSET = (COLUMN_COUNT - 1) / 2; // 6 => 2.5, 8 => 3.5
export const MIN_MAX_ROWS_OFFSET = (ROW_COUNT - 1) / 2;
// same as (columns / 2) - 0.5

const getXYFromPosition = (
  position: number,
  columnCount: number = COLUMN_COUNT
) => ({
  // 23 % 6 = 5; 16 % 6 = 4;
  x: position % columnCount,
  // 23 / 6 = 3.; 16 / 6 = 2.;
  y: Math.floor(position / columnCount),
});

type Card = {
  id: number;
  text: string;
  pairId: number;
  position: number;
};

// set up cards
const unshuffledCards: Card[] = [];

// build cards
for (let i = 0; i < TOTAL_CARDS / 2; i++) {
  // create a pair of cards
  const thisId = new Array(5)
    .fill(0)
    .map((_, i) => {
      const num = Math.floor(Math.random() * 10);
      // should prevent 0's from being the first digit, so all nums should be 5 digits
      return i === 0 ? num || 1 : num;
    })
    .join("");

  // const thisId = Math.ceil(Math.random() * 10000);
  const id1 = Number(thisId + "0");
  const id2 = Number(thisId + "1");
  const num = i * 2;

  const card1 = {
    id: id1,
    text: `card text ${num} a`,
    pairId: id2,
    position: num, // eventually should be a random position
  };
  const card2 = {
    id: id2,
    text: `card text ${num + 1} b`,
    pairId: id1,
    position: num + 1, // eventually should be a random position
  };

  unshuffledCards.push(card1, card2);
}

export function shuffle1(arr: any[]): any[] {
  return Array(arr.length) // create new array
    .fill(null)
    .map((_, i) => [Math.random(), i]) // map so we have [random, index]
    .sort(([randA], [randB]) => randA - randB) // sort by the random numbers
    .map(([, i], newPos) => ({ ...arr[i], position: newPos })); // match input arr to new arr by index
}

// this shuffles indices into the remaining array
const shuffle_FY_alg = (_array: Card[]): Card[] => {
  // walk backward
  const array = _array.slice();
  for (let i = array.length - 1; i > 0; i--) {
    // pick random index from 'remaining' indices
    const j = Math.floor(Math.random() * (i + 1));

    // swap the current with the target indices
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;

    // swap the two using destructuring
    // [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const cards = shuffle_FY_alg(unshuffledCards) as Card[];

console.log({ unshuffledCards, cards });

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

const windowDimensionsColor = "text-gray-400";

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
  if (!cardA || !cardB) {
    return false;
  }
  return cardA.pairId === cardB.id && cardB.pairId === cardA.id;
};

export const findCardById = (id: number): Card | undefined => {
  return cards.find((card) => card.id === id);
};

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
    const dataId = Number((e.target as HTMLElement)?.dataset?.id);
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
      (boardDimensions.value.width - gapPx * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
    const rowHeight =
      (boardDimensions.value.height - gapPx * (ROW_COUNT - 1)) / ROW_COUNT;

    gridSlotDimensions.value = {
      width: columnWidth || 0,
      height: rowHeight || 0,
    };
  });

  // when first hitting client, now we have dimensions, so update our state
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

type FlippableCardProps = {
  card: Card;
  flippedCardId: Signal<number>;
  pairs: Signal<`${number}:${number}`[]>;
  slotDimensions: Signal<{ width: number; height: number }>;
  gap: number;
};

export const FlippableCard = component$(
  ({ card, flippedCardId, pairs, slotDimensions, gap }: FlippableCardProps) => {
    // timer-controlled, so text doesn't show in the DOM when back of card is showing
    const isTextShowing = useSignal<boolean>(false);

    const isThisCardFlipped = useComputed$(() => {
      return flippedCardId.value === card.id;
    });

    const isRemoved = useComputed$(() => {
      return isCardRemoved(pairs.value, card.id);
    });

    /*  this task handles the hiding and showing of text
     *  to be sure that people can't inspect the cards face-down and see the text
     * */
    useTask$((taskCtx) => {
      taskCtx.track(() => isThisCardFlipped.value);
      let timer: ReturnType<typeof setTimeout>;

      // when switched to not showing, need to start timer to hide text after 0.4s (half the transition time)
      // duration is ~half the transition time, but adding/subtracting 100ms for margin to make sure the text doesn't show up after the flip
      if (!isThisCardFlipped.value) {
        timer = setTimeout(() => {
          isTextShowing.value = false;
        }, CARD_FLIP_ANIMATION_DURATION_HALF + 100);
      } else {
        // when switched to showing, should show text immediately
        timer = setTimeout(() => {
          isTextShowing.value = true;
        }, CARD_FLIP_ANIMATION_DURATION_HALF - 100);
      }

      taskCtx.cleanup(() => {
        if (timer) clearTimeout(timer);
      });
    });

    const coords = useComputed$(() => {
      return getXYFromPosition(card.position, COLUMN_COUNT);
    });

    useStylesScoped$(`
    /* container, set width/height */
    .flip-card {
      background-color: transparent; 
      border: 1px solid #f1f1f120;
      border-radius: 10px;
      perspective: 1400px; /* for 3D effect, adjust based on width, and card area compared to viewport */

      margin: auto; /* center in frame */

      aspect-ratio: 2.25 / 3.5;
      width: 100%;
      height: auto;
      maxWidth: 100%;
      maxHeight: 100%;
    }

    /* front and back varying styles */
    .flip-card-inner {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform ${CARD_FLIP_ANIMATION_DURATION}ms;
      transform-style: preserve-3d;
    }

    /* set up front/back, make backface hidden */
    .flip-card-inner .back,
    .flip-card-inner .front {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid #f1f1f1;

      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;    
    }

    /* front and back varying styles */
    .flip-card-inner .front {
      background-color: #bbb;
      color: black;
      transform: rotateY(180deg);
    }
    .flip-card-inner .back {
      background-color: dodgerblue;
      color: white;
    }

    .flip-card-inner .back .circle {
      position: absolute;
      border-radius: 50%;
      background-color: #ffffff40;

      width: 50%;
      height: auto;
      aspect-ratio: 1 / 1;

      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    `);

    const translationsToMiddle = useComputed$(() => {
      const colRatio = MIN_MAX_COLUMNS_OFFSET - coords.value.x;
      const columnWidthPlusGap = slotDimensions.value.width + gap;
      const translateX = columnWidthPlusGap * colRatio;

      const rowRatio = MIN_MAX_ROWS_OFFSET - coords.value.y;
      const rowHeightPlusGap = slotDimensions.value.height + gap;
      const translateY = rowHeightPlusGap * rowRatio;

      return {
        translateX,
        translateY,
        isOnLeftSide: coords.value.x < COLUMN_COUNT / 2,
      };
    });

    const flipTransform = useComputed$(() => {
      return `translateX(${translationsToMiddle.value.translateX}px) 
        translateY(${translationsToMiddle.value.translateY}px) 
        rotateY(${translationsToMiddle.value.isOnLeftSide ? "" : "-"}180deg) 
        scale(2)`; // maybe should be dynamic depending on screen size??
    });

    return (
      <div
        class={`flip-card rounded-md transition-all ${
          isRemoved.value &&
          flippedCardId.value !== card.id &&
          flippedCardId.value !== card.pairId
            ? "opacity-0"
            : "opacity-100 cursor-pointer"
        }`}
        data-id={card.id}
        style={{
          gridColumn: `${coords.value.x + 1} / ${coords.value.x + 2}`,
          gridRow: `${coords.value.y + 1} / ${coords.value.y + 2}`,
          zIndex: isThisCardFlipped.value || isTextShowing.value ? 1000 : 0,
        }}
      >
        <div
          class="flip-card-inner rounded-md"
          data-id={card.id}
          style={
            isThisCardFlipped.value
              ? {
                  transform: flipTransform.value,
                }
              : ""
          }
        >
          <div class={`back rounded-md`} data-id={card.id}>
            <div data-id={card.id} class="circle"></div>
          </div>
          <div class={`front rounded-md`} data-id={card.id}>
            <div
              class={`flex justify-center items-center w-full h-full `}
              data-id={card.id}
            >
              {isTextShowing.value ? card.text : ""}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
